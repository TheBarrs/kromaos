import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  return successResponse({ user });
}
