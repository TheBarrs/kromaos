import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({ status: z.enum(["APPROVED", "CHANGES_REQUESTED"]) });
type Ctx = { params: Promise<{ id: string; versionId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { versionId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const version = await prisma.approvalVersion.update({
    where: { id: versionId },
    data: { status: parsed.data.status },
  });

  await prisma.activityLog.create({
    data: { entityType: "approval_version", entityId: versionId, action: parsed.data.status.toLowerCase(), userId: user.id },
  });

  return successResponse(version);
}
