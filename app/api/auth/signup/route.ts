import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validations";
import { badRequest, serverError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid signup data", parsed.error.flatten());
    }

    const { name, email, password, workspaceName } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return badRequest("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Creator becomes ADMIN of a brand-new workspace (C1 acceptance criteria).
    const result = await db.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({ data: { name: workspaceName } });
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          role: "ADMIN",
          workspaceId: workspace.id,
        },
      });
      return { workspace, user };
    });

    return NextResponse.json(
      { id: result.user.id, email: result.user.email, workspaceId: result.workspace.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("signup error", err);
    return serverError();
  }
}
