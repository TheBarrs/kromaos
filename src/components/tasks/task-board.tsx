"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, cn } from "@/lib/utils";
import { MessageSquare, Calendar } from "lucide-react";
import type { TaskWithRelations } from "@/types";

const COLUMNS = [
  { id: "BRIEFING",    label: "Briefing",     color: "bg-slate-500" },
  { id: "IN_PROGRESS", label: "Em Andamento", color: "bg-blue-500" },
  { id: "REVIEW",      label: "Revisão",      color: "bg-amber-500" },
  { id: "APPROVED",    label: "Aprovado",     color: "bg-emerald-500" },
  { id: "DELIVERED",   label: "Entregue",     color: "bg-purple-500" },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-slate-400", MEDIUM: "text-amber-400", HIGH: "text-orange-400", URGENT: "text-red-400",
};

type Props = { tasks: TaskWithRelations[] };

export function TaskBoard({ tasks }: Props) {
  const router = useRouter();

  async function handleDrop(e: React.DragEvent, status: string) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div
            key={col.id}
            className="flex flex-col gap-3 min-w-[280px] w-[280px] shrink-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-1">
              <span className={cn("h-2 w-2 rounded-full", col.color)} />
              <span className="text-sm font-medium">{col.label}</span>
              <span className="ml-auto text-xs text-[var(--muted-fg)] bg-[var(--surface-2)] rounded-full px-2 py-0.5">
                {colTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 cursor-pointer hover:border-[#f97316]/50 hover:shadow-lg hover:shadow-[#f97316]/5 transition-all group"
                >
                  <p className="text-sm font-medium leading-snug group-hover:text-[#fb923c] transition-colors">
                    {task.title}
                  </p>

                  {task.client && (
                    <p className="text-[11px] text-[var(--muted-fg)] mt-1">{task.client.name}</p>
                  )}

                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="muted" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-[11px] text-[var(--muted-fg)]">
                      {(task._count?.comments ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />{task._count!.comments}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>

                    <div className="flex -space-x-1.5">
                      {task.assignees.slice(0, 3).map((u) => (
                        <Avatar key={u.id} className="h-5 w-5 border border-[var(--surface-1)]">
                          <AvatarImage src={u.avatar ?? undefined} />
                          <AvatarFallback className="text-[9px]">{u.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>

                  <div className={cn("mt-2 text-[10px] font-medium uppercase tracking-wide", PRIORITY_COLORS[task.priority])}>
                    {task.priority}
                  </div>
                </div>
              ))}

              {colTasks.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--muted-fg)]">
                  Arraste tarefas aqui
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
