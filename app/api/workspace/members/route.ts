import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requirePermission, badRequest, serverError } from "@/lib/rbac";
import { inviteMemberSchema } from "@/lib/validations";

// GET /api/workspace/members
export async function GET() {
  const auth = await requirePermission("members:read");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const members = await db.user.findMany({
    where: { workspaceId: user.workspaceId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}

// POST /api/workspace/members — Admin invites a teammate with a role (C2).
export async function POST(req: NextRequest) {
  const auth = await requirePermission("members:write");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await req.json();
    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid member data", parsed.error.flatten());

    const { name, email, password, role } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return badRequest("A user with this email already exists");

    const passwordHash = await bcrypt.hash(password, 12);
    const member = await db.user.create({
      data: { name, email: normalizedEmail, passwordHash, role, workspaceId: user.workspaceId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    console.error("invite member error", err);
    return serverError();
  }
}
