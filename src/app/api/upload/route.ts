export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const formData = await req.formData().catch(() => null);
  if (!formData) return errorResponse("Invalid form data", 400);

  const file = formData.get("file") as File | null;
  if (!file) return errorResponse("No file provided", 400);

  const maxSize = 100 * 1024 * 1024; // 100 MB
  if (file.size > maxSize) return errorResponse("Arquivo muito grande (máx 100 MB)", 400);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads");
  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, filename), Buffer.from(bytes));

  const url = `/uploads/${filename}`;
  return successResponse({
    url,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  }, 201);
}
