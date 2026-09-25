import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, badRequest, serverError } from "@/lib/rbac";
import { generateReportSchema } from "@/lib/validations";
import { generateVoCNarrative, type VoCStats } from "@/lib/ai";
import { format } from "date-fns";

// GET /api/reports — saved reports, newest first.
export async function GET(req: NextRequest) {
  const auth = await requirePermission("reports:read");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const reports = await db.report.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: "desc" },
    include: { generatedBy: { select: { name: true } } },
  });

  return NextResponse.json(
    reports.map((r) => ({
      id: r.id,
      title: r.title,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      createdAt: r.createdAt,
      generatedByName: r.generatedBy.name,
    }))
  );
}

// POST /api/reports — pre-computes exact stats in code (never
// hallucinated), then asks Gemini only to write the narrative around
// those fixed numbers (AI4).
export async function POST(req: NextRequest) {
  const auth = await requirePermission("reports:generate");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await req.json();
    const parsed = generateReportSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid report parameters", parsed.error.flatten());

    const periodStart = new Date(parsed.data.periodStart);
    const periodEnd = new Date(parsed.data.periodEnd);
    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime()) || periodStart >= periodEnd) {
      return badRequest("periodStart must be before periodEnd, both valid dates");
    }

    const periodLength = periodEnd.getTime() - periodStart.getTime();
    const prevStart = new Date(periodStart.getTime() - periodLength);
    const prevEnd = periodStart;

    const [currentItems, previousItems, themeLinks] = await Promise.all([
      db.feedback.findMany({
        where: { workspaceId: user.workspaceId, createdAt: { gte: periodStart, lte: periodEnd } },
      }),
      db.feedback.findMany({
        where: { workspaceId: user.workspaceId, createdAt: { gte: prevStart, lt: prevEnd } },
        select: { sentimentScore: true },
      }),
      db.feedbackTheme.findMany({
        where: {
          feedback: { workspaceId: user.workspaceId, createdAt: { gte: periodStart, lte: periodEnd } },
        },
        include: { theme: true },
      }),
    ]);

    const totalItems = currentItems.length;

    const sentimentBreakdown = {
      positive: currentItems.filter((f) => f.sentiment === "POSITIVE").length,
      neutral: currentItems.filter((f) => f.sentiment === "NEUTRAL").length,
      negative: currentItems.filter((f) => f.sentiment === "NEGATIVE").length,
    };

    const avg = (items: { sentimentScore: number | null }[]) => {
      const scored = items.filter((i) => i.sentimentScore !== null) as { sentimentScore: number }[];
      if (scored.length === 0) return null;
      return scored.reduce((sum, i) => sum + i.sentimentScore, 0) / scored.length;
    };
    const currentAvg = avg(currentItems);
    const previousAvg = avg(previousItems);
    const sentimentDeltaPct =
      currentAvg !== null && previousAvg !== null && previousAvg !== 0
        ? Math.round(((currentAvg - previousAvg) / Math.abs(previousAvg)) * 100)
        : null;

    const themeCounts = new Map<string, number>();
    for (const link of themeLinks) {
      themeCounts.set(link.theme.name, (themeCounts.get(link.theme.name) ?? 0) + 1);
    }
    const topThemes = Array.from(themeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count, deltaPct: null }));

    const representativeQuotes = currentItems
      .filter((f) => f.content.length > 20 && f.content.length < 220)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map((f) => ({ content: f.content, channel: f.channel, sentiment: f.sentiment }));

    const stats: VoCStats = {
      totalItems,
      periodLabel: `${format(periodStart, "MMM d, yyyy")} – ${format(periodEnd, "MMM d, yyyy")}`,
      topThemes,
      sentimentBreakdown,
      sentimentDeltaPct,
      representativeQuotes,
    };

    const narrative = await generateVoCNarrative(stats);

    const title = parsed.data.title ?? `Voice of Customer — ${format(periodStart, "MMM d")} to ${format(periodEnd, "MMM d, yyyy")}`;

    const report = await db.report.create({
      data: {
        title,
        periodStart,
        periodEnd,
        workspaceId: user.workspaceId,
        generatedById: user.id,
        contentJson: JSON.stringify({ stats, narrative }),
      },
    });

    return NextResponse.json({ id: report.id, title: report.title, stats, narrative }, { status: 201 });
  } catch (err) {
    console.error("report generation error", err);
    return serverError("Report generation failed. Check GEMINI_API_KEY and try again.");
  }
}
