import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

const EVENTS = ["DEAL_WON", "TASK_APPROVED", "TASK_CREATED", "CLIENT_CREATED", "CARD_STAGE_CHANGED"] as const;

const schema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.enum(EVENTS)).min(1),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const webhooks = await prisma.webhook.findMany({
    where: { userId: user.id },
    include: { _count: { select: { deliveries: true } } },
    orderBy: { createdAt: "desc" },
  });
  return successResponse(webhooks);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400, parsed.error.issues);

  const webhook = await prisma.webhook.create({ data: { ...parsed.data, userId: user.id } });
  return successResponse(webhook, 201);
}
