export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { onTaskApproved } from "@/lib/automations";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["BRIEFING", "IN_PROGRESS", "REVIEW", "APPROVED", "DELIVERED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  position: z.number().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      client: true,
      project: true,
      owner: { select: { id: true, name: true, avatar: true } },
      assignees: { select: { id: true, name: true, avatar: true } },
      comments: { include: { author: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: "asc" } },
      statusHistory: { orderBy: { changedAt: "asc" } },
    },
  });
  if (!task) return errorResponse("Not found", 404);
  return successResponse(task);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return errorResponse("Not found", 404);

  const { assigneeIds, dueDate, ...rest } = parsed.data;

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : dueDate === null ? null : undefined,
      assignees: assigneeIds ? { set: assigneeIds.map((i) => ({ id: i })) } : undefined,
    },
    include: {
      client: { select: { id: true, name: true } },
      assignees: { select: { id: true, name: true, avatar: true } },
    },
  });

  if (rest.status && rest.status !== existing.status) {
    await prisma.taskStatusHistory.create({
      data: { taskId: id, fromStatus: existing.status, toStatus: rest.status, changedBy: user.id },
    });
    await prisma.activityLog.create({
      data: { entityType: "task", entityId: id, action: `status_changed_to_${rest.status.toLowerCase()}`, userId: user.id, taskId: id },
    });
    if (rest.status === "APPROVED") await onTaskApproved(id);
  }

  return successResponse(task);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  await prisma.task.delete({ where: { id } });
  return successResponse({ deleted: true });
}
