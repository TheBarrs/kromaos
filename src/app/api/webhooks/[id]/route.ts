export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

const EVENTS = ["DEAL_WON", "TASK_APPROVED", "TASK_CREATED", "CLIENT_CREATED", "CARD_STAGE_CHANGED"] as const;

const schema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.enum(EVENTS)).optional(),
  secret: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const wh = await prisma.webhook.findUnique({ where: { id } });
  if (!wh || wh.userId !== user.id) return errorResponse("Not found", 404);

  const updated = await prisma.webhook.update({ where: { id }, data: parsed.data });
  return successResponse(updated);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const wh = await prisma.webhook.findUnique({ where: { id } });
  if (!wh || wh.userId !== user.id) return errorResponse("Not found", 404);

  await prisma.webhook.delete({ where: { id } });
  return successResponse({ deleted: true });
}
