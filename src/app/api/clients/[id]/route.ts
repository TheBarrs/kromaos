export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      tasks: { take: 5, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true } },
      transactions: { take: 5, orderBy: { date: "desc" } },
      subscriptions: { where: { isActive: true } },
      crmDeal: { select: { id: true, stage: true, value: true } },
    },
  });
  if (!client) return errorResponse("Not found", 404);
  return successResponse(client);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const client = await prisma.client.update({ where: { id }, data: parsed.data });
  return successResponse(client);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  await prisma.client.delete({ where: { id } });
  return successResponse({ deleted: true });
}
