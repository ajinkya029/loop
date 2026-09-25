"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Inbox,
  TrendingUp,
  MessageCircleQuestion,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/ask", label: "Ask LOOP", icon: MessageCircleQuestion },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  workspaceName,
  userName,
  role,
}: {
  workspaceName: string;
  userName: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] shrink-0 bg-brand-900 text-white flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-400" />
          LOOP
        </div>
        <p className="text-xs text-brand-300 mt-1 truncate">{workspaceName}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-brand-600 text-white" : "text-brand-200 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 pb-2">
          <p className="text-sm font-medium truncate">{userName}</p>
          <p className="text-xs text-brand-300">{role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-200 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
