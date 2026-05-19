import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const publicRoutes = ["/login", "/register"];
const publicApiRoutes = ["/api/auth/login", "/api/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicRoutes.some((r) => pathname === r) ||
    publicApiRoutes.some((r) => pathname.startsWith(r))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      await jwtVerify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
