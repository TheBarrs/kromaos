import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, hashPassword, verifyPassword } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  return successResponse(user);
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400, parsed.error.issues);

  const { name, currentPassword, newPassword } = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (name) updateData.name = name;

  if (newPassword) {
    if (!currentPassword) return errorResponse("Senha atual é obrigatória", 400);
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.password) return errorResponse("Usuário sem senha definida", 400);
    const valid = await verifyPassword(currentPassword, dbUser.password);
    if (!valid) return errorResponse("Senha atual incorreta", 400);
    updateData.password = await hashPassword(newPassword);
  }

  if (Object.keys(updateData).length === 0) {
    return errorResponse("Nenhuma alteração fornecida", 400);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, avatar: true },
  });

  return successResponse(updated);
}
