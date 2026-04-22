export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  content: z.string().min(1),
  timestamp: z.number().optional(),
  parentId: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string; versionId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { versionId } = await ctx.params;

  const comments = await prisma.timestampComment.findMany({
    where: { versionId, parentId: null },
    include: { replies: { orderBy: { createdAt: "asc" } } },
    orderBy: { timestamp: "asc" },
  });
  return successResponse(comments);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { versionId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const comment = await prisma.timestampComment.create({
    data: { versionId, authorId: user.id, authorName: user.name, ...parsed.data },
  });
  return successResponse(comment, 201);
}
