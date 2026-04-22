export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const now = new Date();
  const startThis = startOfMonth(now);
  const endThis = endOfMonth(now);
  const startLast = startOfMonth(subMonths(now, 1));
  const endLast = endOfMonth(subMonths(now, 1));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);

  const [
    incomeThis, incomeLast, expenseThis,
    activeClients, totalClients,
    tasksDueToday, tasksInProgress, tasksOverdue,
    deals, wonThisMonth,
    mrr, recentActivity,
  ] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: "INCOME", date: { gte: startThis, lte: endThis } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "INCOME", date: { gte: startLast, lte: endLast } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", date: { gte: startThis, lte: endThis } }, _sum: { amount: true } }),
    prisma.client.count({ where: { isActive: true } }),
    prisma.client.count(),
    prisma.task.count({ where: { dueDate: { gte: today, lt: tomorrow }, status: { notIn: ["APPROVED", "DELIVERED"] } } }),
    prisma.task.count({ where: { status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { dueDate: { lt: today }, status: { notIn: ["APPROVED", "DELIVERED"] } } }),
    prisma.crmDeal.aggregate({ where: { stage: { notIn: ["WON", "LOST"] } }, _sum: { value: true } }),
    prisma.crmDeal.count({ where: { stage: "WON", updatedAt: { gte: startThis } } }),
    prisma.subscription.aggregate({ where: { isActive: true }, _sum: { amount: true } }),
    prisma.activityLog.findMany({ take: 10, orderBy: { createdAt: "desc" } }),
  ]);

  const revenueThis = Number(incomeThis._sum.amount ?? 0);
  const revenueLast = Number(incomeLast._sum.amount ?? 0);
  const growth = revenueLast > 0 ? ((revenueThis - revenueLast) / revenueLast) * 100 : 0;

  return successResponse({
    revenue: { thisMonth: revenueThis, lastMonth: revenueLast, growth: Math.round(growth * 10) / 10 },
    expenses: { thisMonth: Number(expenseThis._sum.amount ?? 0) },
    profit: { thisMonth: revenueThis - Number(expenseThis._sum.amount ?? 0) },
    clients: { active: activeClients, total: totalClients },
    tasks: { dueToday: tasksDueToday, inProgress: tasksInProgress, overdue: tasksOverdue },
    deals: { pipeline: Number(deals._sum.value ?? 0), wonThisMonth },
    mrr: Number(mrr._sum.amount ?? 0),
    recentActivity,
  });
}
