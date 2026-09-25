import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, serverError } from "@/lib/rbac";

// GET /api/themes — themes with feedback counts, newest-active first.
export async function GET(req: NextRequest) {
  const auth = await requirePermission("themes:read");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const themes = await db.theme.findMany({
      where: { workspaceId: user.workspaceId },
      include: { _count: { select: { feedback: true } } },
      orderBy: { feedback: { _count: "desc" } },
    });

    return NextResponse.json(
      themes.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        color: t.color,
        count: t._count.feedback,
      }))
    );
  } catch (err) {
    console.error("themes list error", err);
    return serverError();
  }
}
