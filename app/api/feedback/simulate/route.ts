import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, badRequest, serverError } from "@/lib/rbac";
import { embedText, serializeVector } from "@/lib/search";
import { classifyAndSave } from "@/lib/classify";
import { SIMULATED_FEEDBACK } from "@/lib/sample-data";
import type { Channel } from "@prisma/client";

const SIMULATABLE_CHANNELS: Channel[] = [
  "SUPPORT_TICKET",
  "APP_STORE_REVIEW",
  "NPS_SURVEY",
  "SALES_CALL_NOTE",
  "SOCIAL_MENTION",
];

// POST /api/feedback/simulate  { channel?: Channel, count?: number }
// "Pulls" a batch of realistic feedback from a simulated external
// channel, the way a real Zendesk/App Store/Twitter integration would
// push webhooks into LOOP (Section 4.2 explicitly excludes building
// real third-party integrations — this fulfills the same acceptance
// criterion with seed data instead).
export async function POST(req: NextRequest) {
  const auth = await requirePermission("feedback:import");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await req.json().catch(() => ({}));
    const channel: Channel = SIMULATABLE_CHANNELS.includes(body.channel)
      ? body.channel
      : SIMULATABLE_CHANNELS[Math.floor(Math.random() * SIMULATABLE_CHANNELS.length)];
    const count = Math.min(Math.max(Number(body.count) || 8, 1), 30);

    const pool = SIMULATED_FEEDBACK.filter((s) => s.channel === channel);
    if (pool.length === 0) return badRequest(`No simulated data available for channel ${channel}`);

    const picks = Array.from({ length: count }, () => pool[Math.floor(Math.random() * pool.length)]);

    const createdIds: string[] = [];
    for (const item of picks) {
      const feedback = await db.feedback.create({
        data: {
          content: item.content,
          channel,
          customerLabel: item.customerLabel,
          sourceRef: `simulated-${channel.toLowerCase()}`,
          workspaceId: user.workspaceId,
        },
      });
      const vector = embedText(feedback.content);
      await db.embedding.create({
        data: { feedbackId: feedback.id, vector: serializeVector(vector) },
      });
      createdIds.push(feedback.id);
    }

    for (const id of createdIds) {
      try {
        await classifyAndSave(id, user.workspaceId);
      } catch (err) {
        console.error("classify during simulate failed", id, err);
      }
    }

    return NextResponse.json({ channel, imported: createdIds.length });
  } catch (err) {
    console.error("simulate channel error", err);
    return serverError();
  }
}
