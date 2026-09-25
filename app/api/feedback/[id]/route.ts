import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, badRequest, notFound, serverError } from "@/lib/rbac";
import { updateFeedbackStatusSchema } from "@/lib/validations";

// GET /api/feedback/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission("feedback:read");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const feedback = await db.feedback.findFirst({
    // Tenant isolation: id AND workspaceId both required, so guessing
    // another tenant's id in the URL returns 404, never their data.
    where: { id: params.id, workspaceId: user.workspaceId },
    include: { themes: { include: { theme: true } } },
  });
  if (!feedback) return notFound("Feedback item not found");

  return NextResponse.json(feedback);
}

// PATCH /api/feedback/:id — status workflow (NEW -> REVIEWED -> ACTIONED).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission("feedback:write");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await req.json();
    const parsed = updateFeedbackStatusSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid status", parsed.error.flatten());

    const existing = await db.feedback.findFirst({
      where: { id: params.id, workspaceId: user.workspaceId },
    });
    if (!existing) return notFound("Feedback item not found");

    const updated = await db.feedback.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("feedback update error", err);
    return serverError();
  }
}
