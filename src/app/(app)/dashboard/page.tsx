export const dynamic = "force-dynamic";

import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Users, CheckSquare, TrendingUp,
  AlertCircle, Clock, Activity,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

async function getDashboardData() {
  const now = new Date();
  const startThis = startOfMonth(now);
  const endThis = endOfMonth(now);
  const startLast = startOfMonth(subMonths(now, 1));
  const endLast = endOfMonth(subMonths(now, 1));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);

  const [
    incomeThis, incomeLast, expenseThis,
    activeClients,
    tasksDueToday, tasksInProgress, tasksOverdue,
    dealsValue, wonThisMonth,
    mrr, recentActivity,
    upcomingTasks,
  ] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: "INCOME", date: { gte: startThis, lte: endThis } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "INCOME", date: { gte: startLast, lte: endLast } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", date: { gte: startThis, lte: endThis } }, _sum: { amount: true } }),
    prisma.client.count({ where: { isActive: true } }),
    prisma.task.count({ where: { dueDate: { gte: today, lt: tomorrow }, status: { notIn: ["APPROVED", "DELIVERED"] } } }),
    prisma.task.count({ where: { status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { dueDate: { lt: today }, status: { notIn: ["APPROVED", "DELIVERED"] } } }),
    prisma.crmDeal.aggregate({ where: { stage: { notIn: ["WON", "LOST"] } }, _sum: { value: true } }),
    prisma.crmDeal.count({ where: { stage: "WON", updatedAt: { gte: startThis } } }),
    prisma.subscription.aggregate({ where: { isActive: true }, _sum: { amount: true } }),
    prisma.activityLog.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
    prisma.task.findMany({
      where: { dueDate: { gte: today }, status: { notIn: ["APPROVED", "DELIVERED"] } },
      take: 5,
      orderBy: { dueDate: "asc" },
      include: { client: { select: { name: true } } },
    }),
  ]);

  const revenueThis = Number(incomeThis._sum.amount ?? 0);
  const revenueLast = Number(incomeLast._sum.amount ?? 0);
  const growth = revenueLast > 0 ? ((revenueThis - revenueLast) / revenueLast) * 100 : 0;

  return {
    revenue: { thisMonth: revenueThis, growth: Math.round(growth * 10) / 10 },
    profit: revenueThis - Number(expenseThis._sum.amount ?? 0),
    activeClients,
    tasks: { dueToday: tasksDueToday, inProgress: tasksInProgress, overdue: tasksOverdue },
    deals: { pipeline: Number(dealsValue._sum.value ?? 0), wonThisMonth },
    mrr: Number(mrr._sum.amount ?? 0),
    recentActivity,
    upcomingTasks,
  };
}

const TASK_STATUS_MAP: Record<string, { label: string; variant: "default" | "warning" | "success" | "danger" | "muted" }> = {
  BRIEFING:    { label: "Briefing",   variant: "muted" },
  IN_PROGRESS: { label: "Em andamento", variant: "warning" },
  REVIEW:      { label: "Revisão",    variant: "default" },
  APPROVED:    { label: "Aprovado",   variant: "success" },
  DELIVERED:   { label: "Entregue",   variant: "success" },
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Receita do Mês"
            value={formatCurrency(data.revenue.thisMonth)}
            growth={data.revenue.growth}
            icon={DollarSign}
            iconColor="text-emerald-400"
          />
          <StatCard
            title="MRR"
            value={formatCurrency(data.mrr)}
            subtitle="Receita recorrente mensal"
            icon={TrendingUp}
            iconColor="text-[#818cf8]"
          />
          <StatCard
            title="Lucro do Mês"
            value={formatCurrency(data.profit)}
            icon={Activity}
            iconColor="text-amber-400"
          />
          <StatCard
            title="Clientes Ativos"
            value={data.activeClients}
            icon={Users}
            iconColor="text-sky-400"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Task summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-[#6366f1]" />
                Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Vencem hoje",    value: data.tasks.dueToday,    color: "text-amber-400" },
                { label: "Em andamento",   value: data.tasks.inProgress,  color: "text-sky-400" },
                { label: "Atrasadas",      value: data.tasks.overdue,     color: "text-red-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-fg)]">{label}</span>
                  <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* CRM pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#6366f1]" />
                Pipeline CRM
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-fg)]">Valor em negociação</span>
                <span className="font-semibold text-amber-400">{formatCurrency(data.deals.pipeline)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-fg)]">Fechados este mês</span>
                <span className="font-semibold text-emerald-400">{data.deals.wonThisMonth}</span>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#6366f1]" />
                Próximas Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.upcomingTasks.length === 0 && (
                <p className="text-xs text-[var(--muted-fg)]">Nenhuma tarefa próxima.</p>
              )}
              {data.upcomingTasks.map((t) => {
                const s = TASK_STATUS_MAP[t.status] ?? { label: t.status, variant: "muted" as const };
                return (
                  <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.title}</p>
                      {t.client && <p className="text-[10px] text-[var(--muted-fg)]">{t.client.name}</p>}
                    </div>
                    <Badge variant={s.variant} className="shrink-0">{s.label}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Activity feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#6366f1]" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 && (
              <p className="text-sm text-[var(--muted-fg)]">Nenhuma atividade registrada.</p>
            )}
            <ul className="space-y-3">
              {data.recentActivity.map((log) => (
                <li key={log.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#6366f1] ring-4 ring-[#6366f1]/10" />
                  <div className="min-w-0">
                    <p className="text-[var(--foreground)]">
                      <span className="font-medium capitalize">{log.action}</span>
                      {" "}<span className="text-[var(--muted-fg)] lowercase">{log.entityType}</span>
                    </p>
                    <p className="text-[11px] text-[var(--muted-fg)] mt-0.5">{formatRelativeTime(log.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
