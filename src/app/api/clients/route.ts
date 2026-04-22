import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse, parseSearchParams } from "@/lib/api";
import { dispatchWebhook } from "@/lib/webhooks";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url().optional(),
  logo: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const { page, perPage, search } = parseSearchParams(req.url);
  const where: Record<string, unknown> = {};
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { company: { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
  ];

  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        _count: { select: { tasks: true, transactions: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.client.count({ where }),
  ]);

  return successResponse({ data: items, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400, parsed.error.issues);

  const client = await prisma.client.create({ data: parsed.data });

  await prisma.activityLog.create({
    data: { entityType: "client", entityId: client.id, action: "created", userId: user.id, clientId: client.id },
  });
  await dispatchWebhook("CLIENT_CREATED", { clientId: client.id, name: client.name });

  return successResponse(client, 201);
}
