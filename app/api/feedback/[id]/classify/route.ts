import { NextRequest, NextResponse } from "next/server";
import { requirePermission, notFound, serverError } from "@/lib/rbac";
import { classifyAndSave } from "@/lib/classify";

// POST /api/feedback/:id/classify — manual re-classify for corrections.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission("feedback:classify");
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const updated = await classifyAndSave(params.id, user.workspaceId);
    if (!updated) return notFound("Feedback item not found");
    return NextResponse.json(updated);
  } catch (err) {
    console.error("re-classify error", err);
    return serverError("Classification failed. Check GEMINI_API_KEY and try again.");
  }
}
