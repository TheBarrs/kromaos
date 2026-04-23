export const dynamic = "force-dynamic";

import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { startOfMonth, endOfMonth } from "date-fns";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { TransactionForm } from "@/components/financial/transaction-form";

async function getFinancialData() {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const [income, expenses, transactions, subscriptions] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: "INCOME", date: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", date: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.transaction.findMany({
      take: 20,
      orderBy: { date: "desc" },
      include: { client: { select: { name: true } }, category: { select: { name: true, color: true } } },
    }),
    prisma.subscription.findMany({
      where: { isActive: true },
      include: { client: { select: { name: true } } },
      orderBy: { billingDay: "asc" },
    }),
  ]);

  return {
    income: Number(income._sum.amount ?? 0),
    expenses: Number(expenses._sum.amount ?? 0),
    profit: Number(income._sum.amount ?? 0) - Number(expenses._sum.amount ?? 0),
    mrr: subscriptions.reduce((s, sub) => s + Number(sub.amount), 0),
    transactions,
    subscriptions,
  };
}

export default async function FinancialPage() {
  const data = await getFinancialData();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Financeiro" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Receita do Mês",  value: data.income,   icon: TrendingUp,   color: "text-emerald-400" },
            { label: "Despesas do Mês", value: data.expenses, icon: TrendingDown,  color: "text-red-400" },
            { label: "Lucro Líquido",   value: data.profit,   icon: DollarSign,    color: data.profit >= 0 ? "text-emerald-400" : "text-red-400" },
            { label: "MRR",             value: data.mrr,      icon: TrendingUp,    color: "text-[#fb923c]" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[var(--muted-fg)] uppercase tracking-wide">{label}</p>
                  <p className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>{formatCurrency(value)}</p>
                </div>
                <Icon className={`h-5 w-5 mt-1 ${color}`} />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Transactions table */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transações Recentes</CardTitle>
                  <TransactionForm />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--muted-fg)]">
                        <th className="pb-3 text-left font-medium">Descrição</th>
                        <th className="pb-3 text-left font-medium">Cliente</th>
                        <th className="pb-3 text-left font-medium">Data</th>
                        <th className="pb-3 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {data.transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-[var(--surface-2)] transition-colors">
                          <td className="py-3 pr-4">
                            <div>
                              <p className="font-medium">{t.title}</p>
                              {t.category && (
                                <span className="inline-flex items-center gap-1 text-[10px] mt-0.5" style={{ color: t.category.color }}>
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.category.color }} />
                                  {t.category.name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-[var(--muted-fg)]">{t.client?.name ?? "—"}</td>
                          <td className="py-3 pr-4 text-[var(--muted-fg)]">{formatDate(t.date)}</td>
                          <td className={`py-3 text-right font-semibold tabular-nums ${t.type === "INCOME" ? "text-emerald-400" : "text-red-400"}`}>
                            {t.type === "INCOME" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                          </td>
                        </tr>
                      ))}
                      {data.transactions.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-[var(--muted-fg)]">Nenhuma transação registrada</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MRR / Subscriptions */}
          <Card>
            <CardHeader><CardTitle>Assinaturas Ativas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.subscriptions.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-[var(--muted-fg)]">{s.client.name} · dia {s.billingDay}</p>
                  </div>
                  <span className="font-semibold text-emerald-400 tabular-nums">{formatCurrency(Number(s.amount))}</span>
                </div>
              ))}
              {data.subscriptions.length === 0 && (
                <p className="text-sm text-[var(--muted-fg)]">Nenhuma assinatura ativa.</p>
              )}
              {data.subscriptions.length > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-sm font-semibold">
                  <span>Total MRR</span>
                  <span className="text-[#fb923c] tabular-nums">{formatCurrency(data.mrr)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
