import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, badRequest, notFound, forbidden, serverError } from "@/lib/rbac";
import { updateMemberRoleSchema } from "@/lib/validations";

// PATCH /api/workspace/members/:id — change a teammate's role (C2).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission("members:write");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await req.json();
    const parsed = updateMemberRoleSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid role", parsed.error.flatten());

    const target = await db.user.findFirst({
      where: { id: params.id, workspaceId: user.workspaceId },
    });
    if (!target) return notFound("Member not found");

    if (target.id === user.id && parsed.data.role !== "ADMIN") {
      return forbidden("You cannot demote yourself out of Admin.");
    }

    const updated = await db.user.update({
      where: { id: target.id },
      data: { role: parsed.data.role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("update member role error", err);
    return serverError();
  }
}

// DELETE /api/workspace/members/:id — remove a teammate.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission("members:write");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  if (params.id === user.id) {
    return forbidden("You cannot remove yourself from the workspace.");
  }

  const target = await db.user.findFirst({ where: { id: params.id, workspaceId: user.workspaceId } });
  if (!target) return notFound("Member not found");

  await db.user.delete({ where: { id: target.id } });
  return NextResponse.json({ success: true });
}
