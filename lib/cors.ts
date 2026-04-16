import { NextRequest, NextResponse } from "next/server";

export function checkCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");

  // No origin header = same-origin or server-to-server — allow
  if (!origin) return null;

  // Always allow in development
  if (process.env.NODE_ENV === "development") return null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const allowed = [
    baseUrl,
    "https://discover.applitude.tech",
  ].filter(Boolean);

  if (!allowed.some((a) => origin === a || origin.startsWith(a))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
