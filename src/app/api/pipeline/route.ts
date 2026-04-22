export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse, parseSearchParams } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  stage: z.enum(["IDEA", "PRE_PRODUCTION", "PRODUCTION", "EDITING", "INTERNAL_REVIEW", "CLIENT_REVIEW", "APPROVED", "SCHEDULED"]).optional(),
  clientId: z.string().optional(),
  dueDate: z.string().optional(),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assigneeIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const { clientId, stage } = parseSearchParams(req.url);
  const where: Record<string, unknown> = {};
  if (clientId) where.clientId = clientId;
  if (stage) where.stage = stage;

  const cards = await prisma.productionCard.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      assignees: { select: { id: true, name: true, avatar: true } },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: [{ stage: "asc" }, { position: "asc" }],
  });

  return successResponse(cards);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400, parsed.error.issues);

  const { assigneeIds, ...data } = parsed.data;

  const card = await prisma.productionCard.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      assignees: assigneeIds ? { connect: assigneeIds.map((id) => ({ id })) } : undefined,
    },
    include: {
      client: { select: { id: true, name: true } },
      assignees: { select: { id: true, name: true, avatar: true } },
    },
  });

  await prisma.cardStageHistory.create({ data: { cardId: card.id, toStage: card.stage, changedBy: user.id } });
  await prisma.activityLog.create({ data: { entityType: "card", entityId: card.id, action: "created", userId: user.id, cardId: card.id } });

  return successResponse(card, 201);
}
