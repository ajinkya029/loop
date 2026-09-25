import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { requirePermission, badRequest, serverError } from "@/lib/rbac";
import { embedText, serializeVector } from "@/lib/search";
import { classifyAndSave } from "@/lib/classify";
import type { Channel } from "@prisma/client";

const CHANNEL_ALIASES: Record<string, Channel> = {
  support_ticket: "SUPPORT_TICKET",
  "support ticket": "SUPPORT_TICKET",
  app_store_review: "APP_STORE_REVIEW",
  "app store review": "APP_STORE_REVIEW",
  nps_survey: "NPS_SURVEY",
  "nps survey": "NPS_SURVEY",
  csat_survey: "CSAT_SURVEY",
  "csat survey": "CSAT_SURVEY",
  sales_call_note: "SALES_CALL_NOTE",
  "sales call note": "SALES_CALL_NOTE",
  social_mention: "SOCIAL_MENTION",
  "social mention": "SOCIAL_MENTION",
};

function normalizeChannel(raw: string | undefined): Channel {
  if (!raw) return "CSV_IMPORT";
  const key = raw.trim().toLowerCase();
  return CHANNEL_ALIASES[key] ?? "CSV_IMPORT";
}

// POST /api/feedback/import — multipart/form-data with a `file` field.
// Expected columns: content, channel, customer_label, created_at
// (sentiment/themes are left blank; AI classification fills them).
export async function POST(req: NextRequest) {
  const auth = await requirePermission("feedback:import");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return badRequest("Attach a CSV file under the 'file' field");
    }

    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return badRequest("Could not parse CSV file", parsed.errors);
    }

    let imported = 0;
    const failures: Array<{ row: number; reason: string }> = [];
    const createdIds: string[] = [];

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const content = row.content?.trim();
      if (!content) {
        failures.push({ row: i + 2, reason: "Missing 'content'" }); // +2 = header row + 1-index
        continue;
      }

      try {
        const feedback = await db.feedback.create({
          data: {
            content,
            channel: normalizeChannel(row.channel),
            customerLabel: row.customer_label?.trim() || undefined,
            sourceRef: `csv-import-row-${i + 2}`,
            workspaceId: user.workspaceId,
            createdAt: row.created_at ? new Date(row.created_at) : undefined,
          },
        });

        const vector = embedText(feedback.content);
        await db.embedding.create({
          data: { feedbackId: feedback.id, vector: serializeVector(vector) },
        });

        createdIds.push(feedback.id);
        imported++;
      } catch (rowErr) {
        failures.push({ row: i + 2, reason: "Could not save row" });
      }
    }

    // Classify sequentially in the background-ish (awaited, but after
    // response data is prepared) so a slow AI call never risks losing
    // already-imported rows. Errors per item are swallowed — items stay
    // importable/visible even if classification needs a manual retry.
    for (const id of createdIds) {
      try {
        await classifyAndSave(id, user.workspaceId);
      } catch (err) {
        console.error("classify during import failed", id, err);
      }
    }

    return NextResponse.json({
      totalRows: parsed.data.length,
      imported,
      failed: failures.length,
      failures,
    });
  } catch (err) {
    console.error("csv import error", err);
    return serverError();
  }
}
