"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Calendar, MessageSquare } from "lucide-react";
import type { TaskWithRelations } from "@/types";

const STATUS_MAP: Record<string, { label: string; variant: "muted" | "warning" | "default" | "success" | "danger" }> = {
  BRIEFING:    { label: "Briefing",      variant: "muted" },
  IN_PROGRESS: { label: "Em Andamento",  variant: "warning" },
  REVIEW:      { label: "Revisão",       variant: "default" },
  APPROVED:    { label: "Aprovado",      variant: "success" },
  DELIVERED:   { label: "Entregue",      variant: "success" },
};

const PRIORITY_MAP: Record<string, { label: string; variant: "muted" | "warning" | "danger" | "default" }> = {
  LOW:    { label: "Baixa",    variant: "muted" },
  MEDIUM: { label: "Média",    variant: "warning" },
  HIGH:   { label: "Alta",     variant: "danger" },
  URGENT: { label: "Urgente",  variant: "danger" },
};

type Props = { tasks: TaskWithRelations[] };

export function TaskListView({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[var(--muted-fg)] text-sm">
        Nenhuma tarefa encontrada.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-2)]">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-[var(--muted-fg)]">Tarefa</th>
            <th className="px-4 py-3 text-left font-medium text-[var(--muted-fg)]">Cliente</th>
            <th className="px-4 py-3 text-left font-medium text-[var(--muted-fg)]">Status</th>
            <th className="px-4 py-3 text-left font-medium text-[var(--muted-fg)]">Prioridade</th>
            <th className="px-4 py-3 text-left font-medium text-[var(--muted-fg)]">Prazo</th>
            <th className="px-4 py-3 text-left font-medium text-[var(--muted-fg)]">Equipe</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {tasks.map((task) => {
            const s = STATUS_MAP[task.status] ?? { label: task.status, variant: "muted" as const };
            const p = PRIORITY_MAP[task.priority] ?? { label: task.priority, variant: "muted" as const };
            return (
              <tr key={task.id} className="hover:bg-[var(--surface-2)] transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/tasks/${task.id}`} className="font-medium hover:text-[#818cf8] transition-colors">
                    {task.title}
                  </Link>
                  {(task._count?.comments ?? 0) > 0 && (
                    <span className="ml-2 inline-flex items-center gap-0.5 text-[11px] text-[var(--muted-fg)]">
                      <MessageSquare className="h-3 w-3" />{task._count!.comments}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--muted-fg)]">{task.client?.name ?? "—"}</td>
                <td className="px-4 py-3"><Badge variant={s.variant}>{s.label}</Badge></td>
                <td className="px-4 py-3"><Badge variant={p.variant}>{p.label}</Badge></td>
                <td className="px-4 py-3 text-[var(--muted-fg)]">
                  {task.dueDate ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{formatDate(task.dueDate)}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex -space-x-1.5">
                    {task.assignees.slice(0, 4).map((u) => (
                      <Avatar key={u.id} className="h-6 w-6 border border-[var(--surface-1)]">
                        <AvatarImage src={u.avatar ?? undefined} />
                        <AvatarFallback className="text-[10px]">{u.name[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
