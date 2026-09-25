import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, badRequest, serverError } from "@/lib/rbac";
import { askSchema } from "@/lib/validations";
import { embedText, deserializeVector, topKBySimilarity } from "@/lib/search";
import { answerGrounded } from "@/lib/ai";

const TOP_K = 8;

// POST /api/insights/ask — retrieve-then-answer over this workspace's
// feedback ONLY (tenant-scoped), grounding every answer in cited items.
export async function POST(req: NextRequest) {
  const auth = await requirePermission("insights:ask");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await req.json();
    const parsed = askSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid question", parsed.error.flatten());

    const { question } = parsed.data;

    // Step 1 — retrieve: pull this workspace's embedded feedback and
    // rank by cosine similarity to the question (see lib/search.ts).
    const embedded = await db.embedding.findMany({
      where: { feedback: { workspaceId: user.workspaceId } },
      include: { feedback: true },
    });

    const questionVector = embedText(question);
    const candidates = embedded.map((e) => ({
      id: e.feedbackId,
      content: e.feedback.content,
      channel: e.feedback.channel,
      sentiment: e.feedback.sentiment,
      vector: deserializeVector(e.vector),
    }));

    const ranked = topKBySimilarity(questionVector, candidates, TOP_K).filter((r) => r.score > 0);

    // Step 2 — answer: Gemini answers ONLY from the retrieved excerpts.
    const { answer, usedFeedbackIds } = await answerGrounded(question, ranked);

    const usedFeedback = ranked
      .filter((r) => usedFeedbackIds.includes(r.id))
      .map((r) => ({ id: r.id, content: r.content, channel: r.channel, sentiment: r.sentiment, score: r.score }));

    return NextResponse.json({ answer, sources: usedFeedback });
  } catch (err) {
    console.error("ask loop error", err);
    return serverError("Ask LOOP failed. Check GEMINI_API_KEY and try again.");
  }
}
