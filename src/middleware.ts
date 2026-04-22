import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

// Routes accessible by role
const ROLE_ROUTES: Record<string, string[]> = {
  "/financial":  ["ADMIN"],
  "/dashboard":  ["ADMIN", "EQUIPE"],
  "/clients":    ["ADMIN", "EQUIPE"],
  "/tasks":      ["ADMIN", "EQUIPE"],
  "/crm":        ["ADMIN", "EQUIPE"],
  "/webhooks":   ["ADMIN"],
  "/admin":      ["ADMIN"],
  "/pipeline":   ["ADMIN", "EQUIPE", "CLIENTE"],
  "/approvals":  ["ADMIN", "EQUIPE", "CLIENTE"],
  "/settings":   ["ADMIN", "EQUIPE", "CLIENTE"],
};

const REDIRECT_BY_ROLE: Record<string, string> = {
  ADMIN:    "/dashboard",
  EQUIPE:   "/dashboard",
  CLIENTE:  "/pipeline",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect app routes
  const appRoute = Object.keys(ROLE_ROUTES).find((r) => pathname.startsWith(r));
  if (!appRoute) return NextResponse.next();

  const token = req.cookies.get("kroma-token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role as string;
    const allowed = ROLE_ROUTES[appRoute];

    if (!allowed.includes(role)) {
      const fallback = REDIRECT_BY_ROLE[role] ?? "/pipeline";
      return NextResponse.redirect(new URL(fallback, req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/financial/:path*",
    "/tasks/:path*",
    "/pipeline/:path*",
    "/approvals/:path*",
    "/crm/:path*",
    "/settings/:path*",
    "/webhooks/:path*",
    "/admin/:path*",
  ],
};
