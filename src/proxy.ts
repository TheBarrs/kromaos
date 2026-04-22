import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth/login", "/api/auth/register"];

const ROLE_ROUTES: Record<string, string[]> = {
  "/financial":  ["ADMIN"],
  "/webhooks":   ["ADMIN"],
  "/admin":      ["ADMIN"],
  "/dashboard":  ["ADMIN", "EQUIPE"],
  "/clients":    ["ADMIN", "EQUIPE"],
  "/tasks":      ["ADMIN", "EQUIPE"],
  "/crm":        ["ADMIN", "EQUIPE"],
  "/pipeline":   ["ADMIN", "EQUIPE", "CLIENTE"],
  "/approvals":  ["ADMIN", "EQUIPE", "CLIENTE"],
  "/settings":   ["ADMIN", "EQUIPE", "CLIENTE"],
};

const FALLBACK_BY_ROLE: Record<string, string> = {
  ADMIN:    "/dashboard",
  EQUIPE:   "/dashboard",
  CLIENTE:  "/pipeline",
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/admin/seed") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("kroma-token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  const payload = await verifyToken(token);
  if (!payload) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("kroma-token");
    return res;
  }

  const role = payload.role as string;
  const matchedRoute = Object.keys(ROLE_ROUTES).find((r) => pathname.startsWith(r));

  if (matchedRoute) {
    const allowed = ROLE_ROUTES[matchedRoute];
    if (!allowed.includes(role)) {
      const fallback = FALLBACK_BY_ROLE[role] ?? "/pipeline";
      return NextResponse.redirect(new URL(fallback, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
