import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = z.object({ content: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const comment = await prisma.comment.create({
    data: { taskId: id, content: parsed.data.content, authorId: user.id },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });
  return successResponse(comment, 201);
}
