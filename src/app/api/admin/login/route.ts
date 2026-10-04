import { NextResponse } from "next/server";
import { adminCookieValue, checkPassword } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") || "");
  if (!checkPassword(password)) return NextResponse.redirect(new URL("/admin/login?error=1", req.url), 303);
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  res.cookies.set("estoria_admin", adminCookieValue(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14, secure: process.env.NODE_ENV === "production" });
  return res;
}

export async function DELETE(req: Request) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url), 303);
  res.cookies.delete("estoria_admin");
  return res;
}
