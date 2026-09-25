import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getAuthedUser, type AuthedUser } from "@/lib/auth";

/**
 * Central permission matrix. Keep this as the single source of truth
 * for "who can do what" so it can't drift between routes.
 *
 * ADMIN    — manage members/roles, everything Analyst can do.
 * ANALYST  — ingest & manage feedback, trigger AI features, generate reports.
 * VIEWER   — read-only across the workspace.
 */
const PERMISSIONS = {
  "feedback:read": ["ADMIN", "ANALYST", "VIEWER"],
  "feedback:write": ["ADMIN", "ANALYST"],
  "feedback:import": ["ADMIN", "ANALYST"],
  "feedback:classify": ["ADMIN", "ANALYST"],
  "themes:read": ["ADMIN", "ANALYST", "VIEWER"],
  "insights:ask": ["ADMIN", "ANALYST", "VIEWER"],
  "reports:read": ["ADMIN", "ANALYST", "VIEWER"],
  "reports:generate": ["ADMIN", "ANALYST"],
  "members:read": ["ADMIN", "ANALYST", "VIEWER"],
  "members:write": ["ADMIN"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Every API route that touches tenant data should start with this.
 * It guarantees:
 *   1. There is an authenticated session (401 otherwise).
 *   2. The user's role has the required permission (403 otherwise).
 * It returns the authed user so the caller can scope every subsequent
 * Prisma query with `workspaceId: user.workspaceId` — never trust an
 * id in the URL or body without also filtering by that.
 */
export async function requirePermission(
  permission: Permission
): Promise<{ user: AuthedUser } | { error: NextResponse }> {
  const user = await getAuthedUser();
  if (!user) return { error: unauthorized() };
  if (!can(user.role, permission)) return { error: forbidden() };
  return { user };
}
