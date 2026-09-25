import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Redirects any logged-out user hitting a protected page straight to
// /login. API routes do their own session + RBAC checks (see lib/rbac.ts)
// since they need to return 401/403 JSON rather than redirect.
export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inbox/:path*",
    "/trends/:path*",
    "/ask/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
