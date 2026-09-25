import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, serverError } from "@/lib/rbac";

// GET /api/dashboard/stats — stat cards + the 3 required charts' data,
// all scoped to the caller's workspace.
export async function GET(req: NextRequest) {
  const auth = await requirePermission("feedback:read");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, newThisWeek, allRecent, sentimentCounts, themeCounts] = await Promise.all([
      db.feedback.count({ where: { workspaceId: user.workspaceId } }),
      db.feedback.count({ where: { workspaceId: user.workspaceId, createdAt: { gte: sevenDaysAgo } } }),
      db.feedback.findMany({
        where: { workspaceId: user.workspaceId, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, sentiment: true },
      }),
      db.feedback.groupBy({
        by: ["sentiment"],
        where: { workspaceId: user.workspaceId },
        _count: true,
      }),
      db.feedbackTheme.findMany({
        where: { feedback: { workspaceId: user.workspaceId } },
        include: { theme: { select: { name: true, color: true } } },
      }),
    ]);

    const negativeCount = sentimentCounts.find((s) => s.sentiment === "NEGATIVE")?._count ?? 0;
    const pctNegative = total > 0 ? Math.round((negativeCount / total) * 100) : 0;

    // Volume over time — daily buckets, last 30 days.
    const volumeMap = new Map<string, number>();
    for (const item of allRecent) {
      const day = item.createdAt.toISOString().slice(0, 10);
      volumeMap.set(day, (volumeMap.get(day) ?? 0) + 1);
    }
    const volumeOverTime = Array.from(volumeMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Sentiment breakdown.
    const sentimentBreakdown = {
      POSITIVE: sentimentCounts.find((s) => s.sentiment === "POSITIVE")?._count ?? 0,
      NEUTRAL: sentimentCounts.find((s) => s.sentiment === "NEUTRAL")?._count ?? 0,
      NEGATIVE: negativeCount,
      UNCLASSIFIED: sentimentCounts.find((s) => s.sentiment === null)?._count ?? 0,
    };

    // Top themes.
    const themeMap = new Map<string, { count: number; color: string }>();
    for (const link of themeCounts) {
      const key = link.theme.name;
      const existing = themeMap.get(key);
      themeMap.set(key, { count: (existing?.count ?? 0) + 1, color: link.theme.color });
    }
    const topThemes = Array.from(themeMap.entries())
      .map(([name, v]) => ({ name, count: v.count, color: v.color }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return NextResponse.json({
      statCards: { totalItems: total, pctNegative, newThisWeek },
      volumeOverTime,
      sentimentBreakdown,
      topThemes,
    });
  } catch (err) {
    console.error("dashboard stats error", err);
    return serverError();
  }
}
