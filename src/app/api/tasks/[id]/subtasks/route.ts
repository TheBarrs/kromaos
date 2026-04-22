import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const subTasks = await prisma.subTask.findMany({
    where: { taskId: id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return successResponse(subTasks);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = z.object({ title: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const count = await prisma.subTask.count({ where: { taskId: id } });
  const subTask = await prisma.subTask.create({
    data: { taskId: id, title: parsed.data.title, position: count },
  });
  return successResponse(subTask, 201);
}
