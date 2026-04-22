"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

const STATUS_DOT: Record<string, string> = {
  BRIEFING:    "bg-slate-500",
  IN_PROGRESS: "bg-blue-500",
  REVIEW:      "bg-amber-500",
  APPROVED:    "bg-emerald-500",
  DELIVERED:   "bg-purple-500",
};

type Props = { tasks: TaskWithRelations[] };

export function TaskCalendar({ tasks }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(() => new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const tasksWithDue = tasks.filter((t) => t.dueDate);

  function getTasksForDay(day: Date) {
    return tasksWithDue.filter((t) => isSameDay(new Date(t.dueDate!), day));
  }

  const selectedTasks = selected ? getTasksForDay(selected) : [];

  return (
    <div className="flex gap-4 h-full overflow-hidden">
      {/* Calendar grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-base font-semibold capitalize">
            {format(current, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setCurrent(new Date()); setSelected(new Date()); }}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1 shrink-0">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-[var(--muted-fg)] py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 flex-1 overflow-hidden" style={{ gridAutoRows: "1fr" }}>
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, current);
            const isSelected = selected ? isSameDay(day, selected) : false;
            const todayDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelected(isSelected ? null : day)}
                className={cn(
                  "border border-[var(--border)] p-1.5 cursor-pointer transition-colors overflow-hidden",
                  !isCurrentMonth && "opacity-30",
                  isSelected && "bg-[#6366f1]/10 border-[#6366f1]/50",
                  !isSelected && "hover:bg-[var(--surface-2)]"
                )}
              >
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mb-1",
                  todayDay && "bg-[#6366f1] text-white",
                  !todayDay && isCurrentMonth && "text-[var(--foreground)]",
                )}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-1 text-[10px] rounded px-1 py-0.5 bg-[var(--surface-2)] truncate hover:bg-[#6366f1]/20 transition-colors"
                      onClick={(e) => { e.stopPropagation(); router.push(`/tasks/${t.id}`); }}
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[t.status])} />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] text-[var(--muted-fg)] pl-1">+{dayTasks.length - 3} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selected && (
        <div className="w-64 shrink-0 border-l border-[var(--border)] overflow-y-auto p-4">
          <p className="text-sm font-semibold mb-3 capitalize">
            {format(selected, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          {selectedTasks.length === 0 ? (
            <p className="text-xs text-[var(--muted-fg)]">Nenhuma tarefa neste dia.</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => router.push(`/tasks/${t.id}`)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3 cursor-pointer hover:border-[#6366f1]/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", STATUS_DOT[t.status])} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{t.title}</p>
                      {t.client && <p className="text-[10px] text-[var(--muted-fg)] mt-0.5">{t.client.name}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
