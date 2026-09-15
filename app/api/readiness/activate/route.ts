import { NextResponse } from "next/server";
import {
  activateReadinessPayment,
  hasValidReadinessAccess,
  READINESS_ACCESS_COOKIE,
} from "@/lib/readiness-access";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${READINESS_ACCESS_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  if (token && await hasValidReadinessAccess(decodeURIComponent(token))) {
    return NextResponse.json({ status: "ready" });
  }

  const result = await activateReadinessPayment(sessionId);

  if (result.status === "pending") {
    return NextResponse.json({ status: "pending" }, { status: 202 });
  }
  if (result.status === "used") {
    return NextResponse.json({ status: "used" }, { status: 409 });
  }
  if (result.status === "invalid") {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  // Returning JSON here (rather than a redirect) matters: this endpoint is
  // polled with fetch() from the payment confirmation page. A redirect
  // response gets silently followed by fetch and returns HTML instead of
  // JSON, so the caller can never actually detect success. The client
  // performs the navigation itself once it sees "ready".
  const response = NextResponse.json({ status: "ready" });
  response.cookies.set(READINESS_ACCESS_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: result.maxAge,
  });
  return response;
}
