export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  if (user.role !== "ADMIN") return errorResponse("Forbidden", 403);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });

  return successResponse(users);
}
