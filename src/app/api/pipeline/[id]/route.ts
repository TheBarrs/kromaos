export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { dispatchWebhook } from "@/lib/webhooks";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  stage: z.enum(["IDEA", "PRE_PRODUCTION", "PRODUCTION", "EDITING", "INTERNAL_REVIEW", "CLIENT_REVIEW", "APPROVED", "SCHEDULED"]).optional(),
  clientId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  assigneeIds: z.array(z.string()).optional(),
  position: z.number().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const card = await prisma.productionCard.findUnique({
    where: { id },
    include: {
      client: true,
      assignees: { select: { id: true, name: true, avatar: true } },
      attachments: true,
      comments: { include: { author: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: "asc" } },
      stageHistory: { orderBy: { changedAt: "asc" } },
    },
  });
  if (!card) return errorResponse("Not found", 404);
  return successResponse(card);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const existing = await prisma.productionCard.findUnique({ where: { id } });
  if (!existing) return errorResponse("Not found", 404);

  const { assigneeIds, dueDate, ...rest } = parsed.data;

  const card = await prisma.productionCard.update({
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

  if (rest.stage && rest.stage !== existing.stage) {
    await prisma.cardStageHistory.create({
      data: { cardId: id, fromStage: existing.stage, toStage: rest.stage, changedBy: user.id },
    });
    await prisma.activityLog.create({
      data: { entityType: "card", entityId: id, action: `stage_changed_to_${rest.stage.toLowerCase()}`, userId: user.id, cardId: id },
    });
    await dispatchWebhook("CARD_STAGE_CHANGED", { cardId: id, from: existing.stage, to: rest.stage });
  }

  return successResponse(card);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  await prisma.productionCard.delete({ where: { id } });
  return successResponse({ deleted: true });
}
