import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string; subId: string }> };

const schema = z.object({
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  position: z.number().optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { subId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const subTask = await prisma.subTask.update({
    where: { id: subId },
    data: parsed.data,
  });
  return successResponse(subTask);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { subId } = await ctx.params;

  await prisma.subTask.delete({ where: { id: subId } });
  return successResponse({ deleted: true });
}
