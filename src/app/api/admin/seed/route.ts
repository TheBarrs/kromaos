export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// One-time endpoint to promote the owner account to ADMIN + ACTIVE.
// Protected by a secret key passed as query param.
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "kromaos-seed-2026") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.updateMany({
    where: { email: "eldervictor.0@gmail.com" },
    data: { role: "ADMIN", status: "ACTIVE" },
  });

  return Response.json({ updated: user.count });
}
