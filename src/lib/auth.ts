import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: { userId: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function getAuthUser(req: NextRequest) {
  const cookie = req.cookies.get("kroma-token")?.value;
  const header = req.headers.get("authorization")?.replace("Bearer ", "");
  const token = cookie || header;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, role: true, status: true, avatar: true },
  });
}

export function requireAuth(handler: Function, allowedRoles?: string[]) {
  return async (req: NextRequest, ctx: unknown) => {
    const user = await getAuthUser(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(req, ctx, user);
  };
}
