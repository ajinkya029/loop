import { db } from "@/lib/db";
import { classifyFeedback } from "@/lib/ai";

/**
 * AI1 — classifies one feedback item, persists the result on the record,
 * and links it to workspace Theme rows (creating new ones only when no
 * existing theme fits). Called on ingest and from the manual
 * "re-classify" action; never recomputed on plain page loads.
 */
export async function classifyAndSave(feedbackId: string, workspaceId: string) {
  const feedback = await db.feedback.findFirst({
    where: { id: feedbackId, workspaceId },
  });
  if (!feedback) return null;

  const existingThemes = await db.theme.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
  });

  const result = await classifyFeedback(
    feedback.content,
    existingThemes.map((t) => t.name)
  );

  const themeIds: string[] = [];
  for (const themeName of result.themes) {
    const existing = existingThemes.find(
      (t) => t.name.toLowerCase() === themeName.toLowerCase()
    );
    if (existing) {
      themeIds.push(existing.id);
    } else {
      const created = await db.theme.upsert({
        where: { workspaceId_name: { workspaceId, name: themeName } },
        update: {},
        create: { workspaceId, name: themeName },
      });
      themeIds.push(created.id);
      existingThemes.push({ id: created.id, name: themeName });
    }
  }

  const updated = await db.$transaction(async (tx) => {
    await tx.feedbackTheme.deleteMany({ where: { feedbackId } });
    await tx.feedbackTheme.createMany({
      data: themeIds.map((themeId) => ({ feedbackId, themeId, confidence: 0.85 })),
      skipDuplicates: true,
    });

    return tx.feedback.update({
      where: { id: feedbackId },
      data: {
        sentiment: result.sentiment,
        sentimentScore: result.sentimentScore,
        featureArea: result.featureArea,
        aiRationale: result.rationale,
        classifiedAt: new Date(),
      },
      include: { themes: { include: { theme: true } } },
    });
  });

  return updated;
}
