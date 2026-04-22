import { successResponse } from "@/lib/api";

export async function POST() {
  const res = successResponse({ message: "Logged out" });
  const response = new Response(res.body, res);
  response.headers.set("Set-Cookie", "kroma-token=; Path=/; HttpOnly; Max-Age=0");
  return response;
}
