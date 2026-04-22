export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { onDealWon } from "@/lib/automations";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  stage: z.enum(["LEAD", "CONTACTED", "DIAGNOSIS", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"]).optional(),
  value: z.number().positive().optional().nullable(),
  source: z.string().optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedClose: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  position: z.number().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const deal = await prisma.crmDeal.findUnique({
    where: { id },
    include: {
      client: true,
      owner: { select: { id: true, name: true, avatar: true } },
      notes: { orderBy: { createdAt: "desc" } },
      followUps: { orderBy: { dueAt: "asc" } },
      stageHistory: { orderBy: { changedAt: "asc" } },
    },
  });
  if (!deal) return errorResponse("Not found", 404);
  return successResponse(deal);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const existing = await prisma.crmDeal.findUnique({ where: { id } });
  if (!existing) return errorResponse("Not found", 404);

  const { expectedClose, ...rest } = parsed.data;
  const deal = await prisma.crmDeal.update({
    where: { id },
    data: {
      ...rest,
      expectedClose: expectedClose ? new Date(expectedClose) : expectedClose === null ? null : undefined,
    },
    include: { owner: { select: { id: true, name: true, avatar: true } } },
  });

  if (rest.stage && rest.stage !== existing.stage) {
    await prisma.dealStageHistory.create({
      data: { dealId: id, fromStage: existing.stage, toStage: rest.stage, changedBy: user.id },
    });
    await prisma.activityLog.create({
      data: { entityType: "deal", entityId: id, action: `stage_changed_to_${rest.stage.toLowerCase()}`, userId: user.id, dealId: id },
    });
    if (rest.stage === "WON") await onDealWon(id);
  }

  return successResponse(deal);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;
  await prisma.crmDeal.delete({ where: { id } });
  return successResponse({ deleted: true });
}
