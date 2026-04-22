export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "MANAGER", "EDITOR", "CLIENT"]).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400, parsed.error.issues);

  const { name, email, password, role } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return errorResponse("Email already registered", 409);

  const hashed = await hashPassword(password);
  const isOwner = email === "eldervictor.0@gmail.com";
  const user = await prisma.user.create({
    data: {
      name, email, password: hashed,
      role: isOwner ? "ADMIN" : (role ?? "EDITOR"),
      status: isOwner ? "ACTIVE" : "PENDING",
    },
    select: { id: true, name: true, email: true, role: true, status: true, avatar: true },
  });

  const token = await signToken({ userId: user.id, role: user.role });

  const res = successResponse({ user }, 201);
  const response = new Response(res.body, res);
  response.headers.set(
    "Set-Cookie",
    `kroma-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  );
  return response;
}
