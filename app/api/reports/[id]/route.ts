import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, notFound, serverError } from "@/lib/rbac";

// GET /api/reports/:id — full saved report content, tenant-scoped.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission("reports:read");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const report = await db.report.findFirst({
      where: { id: params.id, workspaceId: user.workspaceId },
      include: { generatedBy: { select: { name: true } } },
    });
    if (!report) return notFound("Report not found");

    return NextResponse.json({
      id: report.id,
      title: report.title,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      createdAt: report.createdAt,
      generatedByName: report.generatedBy.name,
      ...JSON.parse(report.contentJson),
    });
  } catch (err) {
    console.error("report detail error", err);
    return serverError();
  }
}
