export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse, parseSearchParams } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  clientId: z.string().optional(),
  fileUrl: z.string().optional(),
  mimeType: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const { clientId } = parseSearchParams(req.url);
  const where: Record<string, unknown> = {};
  if (clientId) where.clientId = clientId;
  if ((user.role as string) === "CLIENTE") {
    where.client = { crmDeal: { ownerId: user.id } };
  }

  const assets = await prisma.approvalAsset.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      versions: { orderBy: { versionNumber: "desc" }, take: 1, select: { id: true, versionNumber: true, status: true, mimeType: true, createdAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return successResponse(assets);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const { fileUrl, mimeType, ...assetData } = parsed.data;

  const asset = await prisma.approvalAsset.create({
    data: {
      ...assetData,
      ...(fileUrl && mimeType ? {
        versions: {
          create: {
            versionNumber: 1,
            fileUrl,
            mimeType,
            uploadedById: user.id,
          },
        },
      } : {}),
    },
    include: {
      client: { select: { id: true, name: true } },
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });

  return successResponse(asset, 201);
}
