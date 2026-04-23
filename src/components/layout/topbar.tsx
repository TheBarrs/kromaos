"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type TopbarProps = { title?: string };

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-1)] px-6 gap-4">
      {title && <h1 className="text-lg font-semibold shrink-0">{title}</h1>}

      <div className="flex-1 max-w-sm">
        <Input
          placeholder="Buscar..."
          leftIcon={<Search className="h-4 w-4" />}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--surface-2)] transition-colors">
          <Bell className="h-4 w-4 text-[var(--muted-fg)]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#f97316]" />
        </button>
      </div>
    </header>
  );
}
