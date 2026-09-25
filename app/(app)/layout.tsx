import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar
        workspaceName={session.user.workspaceName}
        userName={session.user.name ?? session.user.email}
        role={session.user.role}
      />
      <main className="flex-1 p-6 md:p-8 max-w-[1400px]">{children}</main>
    </div>
  );
}
