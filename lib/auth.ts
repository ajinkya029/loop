import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { workspace: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspaceId: user.workspaceId,
          workspaceName: user.workspace.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.workspaceId = user.workspaceId;
        token.workspaceName = user.workspaceName;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.workspaceId = token.workspaceId;
      session.user.workspaceName = token.workspaceName;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Server-side session helper for use in route handlers and server
 * components. Never trust a role/workspaceId sent from the client —
 * this is the only source of truth for "who is calling".
 */
export async function getSession() {
  return getServerSession(authOptions);
}

export type AuthedUser = {
  id: string;
  role: Role;
  workspaceId: string;
  workspaceName: string;
};

/**
 * Throws-free helper: returns the authed user or null. Route handlers
 * should immediately 401 when this is null.
 */
export async function getAuthedUser(): Promise<AuthedUser | null> {
  const session = await getSession();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    role: session.user.role,
    workspaceId: session.user.workspaceId,
    workspaceName: session.user.workspaceName,
  };
}
