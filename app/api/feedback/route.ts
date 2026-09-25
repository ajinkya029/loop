import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, badRequest, serverError } from "@/lib/rbac";
import { createFeedbackSchema, feedbackListQuerySchema } from "@/lib/validations";
import { embedText, serializeVector } from "@/lib/search";
import { classifyAndSave } from "@/lib/classify";
import type { Prisma } from "@prisma/client";

// GET /api/feedback — paginated, filtered, searchable inbox (C4).
export async function GET(req: NextRequest) {
  const auth = await requirePermission("feedback:read");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const query = feedbackListQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );
  if (!query.success) return badRequest("Invalid query parameters", query.error.flatten());

  const { page, pageSize, channel, sentiment, status, themeId, search, dateFrom, dateTo } =
    query.data;

  // SECURITY: workspaceId is ALWAYS the first filter and is taken only
  // from the authenticated session — never from the request. This is
  // what guarantees Company A can never read Company B's rows.
  const where: Prisma.FeedbackWhereInput = {
    workspaceId: user.workspaceId,
    ...(channel && { channel }),
    ...(sentiment && { sentiment }),
    ...(status && { status }),
    ...(themeId && { themes: { some: { themeId } } }),
    ...(search && { content: { contains: search, mode: "insensitive" } }),
    ...((dateFrom || dateTo) && {
      createdAt: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      },
    }),
  };

  try {
    const [items, total] = await Promise.all([
      db.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { themes: { include: { theme: true } } },
      }),
      db.feedback.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    console.error("feedback list error", err);
    return serverError();
  }
}

// POST /api/feedback — single-entry ingestion (C3).
export async function POST(req: NextRequest) {
  const auth = await requirePermission("feedback:write");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await req.json();
    const parsed = createFeedbackSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid feedback data", parsed.error.flatten());

    const feedback = await db.feedback.create({
      data: {
        ...parsed.data,
        workspaceId: user.workspaceId,
        status: "NEW",
      },
    });

    // Embed immediately so it's searchable by Ask LOOP right away.
    const vector = embedText(feedback.content);
    await db.embedding.create({
      data: { feedbackId: feedback.id, vector: serializeVector(vector) },
    });

    // AI1: classify on ingest. Best-effort — if Gemini/API key isn't
    // configured yet, the item still saves and can be classified later
    // via the manual re-classify action instead of failing ingestion.
    let classified = feedback;
    try {
      classified = (await classifyAndSave(feedback.id, user.workspaceId)) ?? feedback;
    } catch (err) {
      console.error("classify-on-ingest failed", err);
    }

    return NextResponse.json(classified, { status: 201 });
  } catch (err) {
    console.error("feedback create error", err);
    return serverError();
  }
}
