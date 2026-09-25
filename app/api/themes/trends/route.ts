import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, serverError } from "@/lib/rbac";

// GET /api/themes/trends?days=30
// Returns per-theme counts for the current window vs the immediately
// preceding window of equal length (spike detection), plus a daily
// time series for the top themes so the frontend can chart volume
// over time (AI2 acceptance criteria 1-2).
export async function GET(req: NextRequest) {
  const auth = await requirePermission("themes:read");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days")) || 30, 7), 180);

  try {
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - days);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - days);

    const [themes, currentLinks, previousLinks] = await Promise.all([
      db.theme.findMany({ where: { workspaceId: user.workspaceId } }),
      db.feedbackTheme.findMany({
        where: {
          theme: { workspaceId: user.workspaceId },
          feedback: { createdAt: { gte: currentStart, lte: now } },
        },
        include: { feedback: { select: { createdAt: true } } },
      }),
      db.feedbackTheme.findMany({
        where: {
          theme: { workspaceId: user.workspaceId },
          feedback: { createdAt: { gte: previousStart, lt: currentStart } },
        },
        select: { themeId: true },
      }),
    ]);

    const currentCounts = new Map<string, number>();
    const previousCounts = new Map<string, number>();
    for (const link of currentLinks) {
      currentCounts.set(link.themeId, (currentCounts.get(link.themeId) ?? 0) + 1);
    }
    for (const link of previousLinks) {
      previousCounts.set(link.themeId, (previousCounts.get(link.themeId) ?? 0) + 1);
    }

    const themeSummaries = themes
      .map((theme) => {
        const current = currentCounts.get(theme.id) ?? 0;
        const previous = previousCounts.get(theme.id) ?? 0;
        const deltaPct = previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);
        // Spike: meaningfully more volume than last period, with enough
        // items that it isn't just noise from 1 -> 2.
        const isSpike = current >= 3 && deltaPct >= 30;
        return { id: theme.id, name: theme.name, color: theme.color, current, previous, deltaPct, isSpike };
      })
      .sort((a, b) => b.current - a.current);

    // Daily volume series for the top 5 themes by current-period count.
    const topThemeIds = new Set(themeSummaries.slice(0, 5).map((t) => t.id));
    const bucketFormat = (d: Date) => d.toISOString().slice(0, 10);
    const series = new Map<string, Record<string, number>>();

    for (const link of currentLinks) {
      if (!topThemeIds.has(link.themeId)) continue;
      const day = bucketFormat(link.feedback.createdAt);
      if (!series.has(day)) series.set(day, {});
      const dayBucket = series.get(day)!;
      dayBucket[link.themeId] = (dayBucket[link.themeId] ?? 0) + 1;
    }

    const timeSeries = Array.from(series.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    return NextResponse.json({
      windowDays: days,
      themes: themeSummaries,
      topThemeIds: Array.from(topThemeIds),
      timeSeries,
    });
  } catch (err) {
    console.error("theme trends error", err);
    return serverError();
  }
}
