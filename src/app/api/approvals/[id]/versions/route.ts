import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  fileUrl: z.string().url(),
  mimeType: z.string(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await ctx.params;

  const versions = await prisma.approvalVersion.findMany({
    where: { assetId: id },
    include: {
      uploadedBy: { select: { id: true, name: true, avatar: true } },
      comments: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { versionNumber: "desc" },
  });
  return successResponse(versions);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  const { id: assetId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const last = await prisma.approvalVersion.findFirst({ where: { assetId }, orderBy: { versionNumber: "desc" } });
  const versionNumber = (last?.versionNumber ?? 0) + 1;

  const version = await prisma.approvalVersion.create({
    data: { assetId, ...parsed.data, versionNumber, uploadedById: user.id },
    include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
  });

  await prisma.approvalAsset.update({ where: { id: assetId }, data: { updatedAt: new Date() } });

  return successResponse(version, 201);
}
