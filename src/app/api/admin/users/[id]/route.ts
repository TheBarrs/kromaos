export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
  role: z.enum(["ADMIN", "MANAGER", "EDITOR", "CLIENT"]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await getAuthUser(req);
  if (!admin) return errorResponse("Unauthorized", 401);
  if (admin.role !== "ADMIN") return errorResponse("Forbidden", 403);

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const updated = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  return successResponse(updated);
}
