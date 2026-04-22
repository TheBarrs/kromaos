import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse, parseSearchParams } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.string(),
  description: z.string().optional(),
  receipt: z.string().optional(),
  categoryId: z.string().optional(),
  clientId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const { page, perPage, search, sortBy, sortOrder, type, clientId, categoryId } = parseSearchParams(req.url);

  const where: Record<string, unknown> = {};
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (type && (type === "INCOME" || type === "EXPENSE")) where.type = type;
  if (clientId) where.clientId = clientId;
  if (categoryId) where.categoryId = categoryId;

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { client: { select: { id: true, name: true } }, category: { select: { id: true, name: true, color: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.transaction.count({ where }),
  ]);

  return successResponse({ data: items, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400, parsed.error.issues);

  const item = await prisma.transaction.create({
    data: { ...parsed.data, amount: parsed.data.amount, date: new Date(parsed.data.date) },
    include: { client: { select: { id: true, name: true } }, category: true },
  });

  await prisma.activityLog.create({
    data: { entityType: "transaction", entityId: item.id, action: "created", userId: user.id },
  });

  return successResponse(item, 201);
}
