"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, DollarSign, CheckSquare,
  Film, Eye, TrendingUp, Settings, Webhook, LogOut, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

type NavItem = { href: string; label: string; icon: React.ElementType; roles: string[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard, roles: ["ADMIN", "EQUIPE"] },
  { href: "/clients",   label: "Clientes",   icon: Users,           roles: ["ADMIN", "EQUIPE"] },
  { href: "/financial", label: "Financeiro", icon: DollarSign,      roles: ["ADMIN"] },
  { href: "/tasks",     label: "Tarefas",    icon: CheckSquare,     roles: ["ADMIN", "EQUIPE"] },
  { href: "/pipeline",  label: "Pipeline",   icon: Film,            roles: ["ADMIN", "EQUIPE", "CLIENTE"] },
  { href: "/approvals", label: "Aprovações", icon: Eye,             roles: ["ADMIN", "EQUIPE", "CLIENTE"] },
  { href: "/crm",       label: "CRM",        icon: TrendingUp,      roles: ["ADMIN", "EQUIPE"] },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: "/settings", label: "Configurações", icon: Settings, roles: ["ADMIN", "EQUIPE", "CLIENTE"] },
  { href: "/webhooks", label: "Webhooks",      icon: Webhook,  roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const role = user?.role ?? "";

  const visibleNav    = NAV_ITEMS.filter((i) => i.roles.includes(role));
  const visibleBottom = BOTTOM_ITEMS.filter((i) => i.roles.includes(role));

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-1)]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-[var(--border)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]">
          <span className="text-xs font-bold text-white">K</span>
        </div>
        <span className="text-base font-semibold tracking-tight">Kroma OS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[#6366f1]/15 text-[#818cf8] font-medium"
                  : "text-[var(--muted-fg)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[var(--border)] px-3 py-3 space-y-0.5">
        {role === "ADMIN" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/admin")
                ? "bg-[#6366f1]/15 text-[#818cf8] font-medium"
                : "text-[var(--muted-fg)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Admin
          </Link>
        )}
        {visibleBottom.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--muted-fg)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors",
              pathname.startsWith(href) && "bg-[var(--surface-2)] text-[var(--foreground)]"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {/* User */}
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 mt-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6366f1]/20 text-[#818cf8] text-xs font-semibold uppercase">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{user?.name ?? "Usuário"}</p>
            <p className="text-[10px] text-[var(--muted-fg)] truncate">
              {role === "ADMIN" ? "Admin" : role === "EQUIPE" ? "Equipe" : role === "CLIENTE" ? "Cliente" : role}
            </p>
          </div>
          <button onClick={logout} className="text-[var(--muted-fg)] hover:text-red-400 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
