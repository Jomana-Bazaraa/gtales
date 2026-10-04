import { NextResponse, type NextRequest } from "next/server";

/** Protects /admin/* (except /admin/login). The cookie is validated properly in the admin layout; here we only gate on presence. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!request.cookies.get("estoria_admin")?.value) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
