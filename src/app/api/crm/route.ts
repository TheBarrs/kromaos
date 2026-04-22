export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse, parseSearchParams } from "@/lib/api";
import { onDealWon } from "@/lib/automations";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  stage: z.enum(["LEAD", "CONTACTED", "DIAGNOSIS", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"]).optional(),
  value: z.number().positive().optional(),
  source: z.string().optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedClose: z.string().optional(),
  ownerId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const { stage, ownerId } = parseSearchParams(req.url);
  const where: Record<string, unknown> = {};
  if (stage) where.stage = stage;
  if (ownerId) where.ownerId = ownerId;

  const deals = await prisma.crmDeal.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, avatar: true } },
      _count: { select: { notes: true, followUps: true } },
    },
    orderBy: [{ stage: "asc" }, { position: "asc" }, { createdAt: "desc" }],
  });

  return successResponse(deals);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400, parsed.error.issues);

  const deal = await prisma.crmDeal.create({
    data: {
      ...parsed.data,
      ownerId: parsed.data.ownerId ?? user.id,
      expectedClose: parsed.data.expectedClose ? new Date(parsed.data.expectedClose) : undefined,
    },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
    },
  });

  await prisma.dealStageHistory.create({ data: { dealId: deal.id, toStage: deal.stage, changedBy: user.id } });
  await prisma.activityLog.create({ data: { entityType: "deal", entityId: deal.id, action: "created", userId: user.id, dealId: deal.id } });

  if (deal.stage === "WON") await onDealWon(deal.id);

  return successResponse(deal, 201);
}
