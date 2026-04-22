import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  receipt: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const item = await prisma.transaction.findUnique({
    where: { id },
    include: { client: true, category: true },
  });
  if (!item) return errorResponse("Not found", 404);
  return successResponse(item);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const data: Record<string, unknown> = { ...parsed.data };
  if (data.date) data.date = new Date(data.date as string);

  const item = await prisma.transaction.update({ where: { id }, data, include: { client: true, category: true } });
  return successResponse(item);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  await prisma.transaction.delete({ where: { id } });
  return successResponse({ deleted: true });
}
