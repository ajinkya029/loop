import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, notFound, serverError } from "@/lib/rbac";

// GET /api/themes/:id — theme detail + the feedback items in it (C5/AI2 drill-down).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission("themes:read");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const theme = await db.theme.findFirst({
      where: { id: params.id, workspaceId: user.workspaceId },
    });
    if (!theme) return notFound("Theme not found");

    const feedback = await db.feedback.findMany({
      where: { workspaceId: user.workspaceId, themes: { some: { themeId: theme.id } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ theme, feedback });
  } catch (err) {
    console.error("theme detail error", err);
    return serverError();
  }
}
