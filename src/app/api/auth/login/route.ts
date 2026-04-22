import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) return errorResponse("Invalid credentials", 401);

  const valid = await verifyPassword(password, user.password);
  if (!valid) return errorResponse("Invalid credentials", 401);

  const token = await signToken({ userId: user.id, role: user.role });

  const res = successResponse({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  const response = new Response(res.body, res);
  response.headers.set(
    "Set-Cookie",
    `kroma-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  );
  return response;
}
