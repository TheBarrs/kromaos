export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse, parseSearchParams } from "@/lib/api";
import { onTaskApproved } from "@/lib/automations";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["BRIEFING", "IN_PROGRESS", "REVIEW", "APPROVED", "DELIVERED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  ownerId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const { page, perPage, search, status, clientId, projectId, assigneeId } = parseSearchParams(req.url);

  const where: Record<string, unknown> = {};
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;
  if (projectId) where.projectId = projectId;
  if (assigneeId) where.assignees = { some: { id: assigneeId } };

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, avatar: true } },
        assignees: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.task.count({ where }),
  ]);

  return successResponse({ data: items, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400, parsed.error.issues);

  const { assigneeIds, ...data } = parsed.data;

  const task = await prisma.task.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      ownerId: data.ownerId ?? user.id,
      assignees: assigneeIds ? { connect: assigneeIds.map((id) => ({ id })) } : undefined,
    },
    include: {
      client: { select: { id: true, name: true } },
      assignees: { select: { id: true, name: true, avatar: true } },
    },
  });

  await prisma.taskStatusHistory.create({ data: { taskId: task.id, toStatus: task.status, changedBy: user.id } });
  await prisma.activityLog.create({ data: { entityType: "task", entityId: task.id, action: "created", userId: user.id, taskId: task.id } });

  if (task.status === "APPROVED") await onTaskApproved(task.id);

  return successResponse(task, 201);
}
