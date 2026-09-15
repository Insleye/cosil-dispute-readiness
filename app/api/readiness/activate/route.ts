import { NextResponse } from "next/server";
import {
  activateReadinessPayment,
  hasValidReadinessAccess,
  READINESS_ACCESS_COOKIE,
} from "@/lib/readiness-access";

type ActivationStatus = "invalid" | "pending" | "used" | "ready";

const STATUS_HTTP_CODE: Record<ActivationStatus, number> = {
  invalid: 400,
  pending: 202,
  used: 409,
  ready: 200,
};

/**
 * True when this request is a real browser navigating here directly (e.g.
 * Stripe's Payment Link success_url pointing straight at this endpoint),
 * false when it's a fetch() call polling for status from the payment
 * confirmation page's own JavaScript.
 *
 * A top-level browser navigation sends "text/html" as its primary Accept
 * type; a bare fetch() call (as used by components/payment-confirmation.tsx)
 * does not. This is the same heuristic used to detect e.g. HTMX requests.
 */
function isBrowserNavigation(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  const asHtml = isBrowserNavigation(request);

  function respond(
    status: ActivationStatus,
    cookie?: { token: string; maxAge: number }
  ) {
    if (asHtml) {
      // A customer must never land on this endpoint and see raw JSON.
      // Send them to the human-readable confirmation page instead, which
      // polls this same endpoint via fetch() in the background and shows
      // a proper message for every status, including a retry experience
      // while payment is still confirming.
      const redirectUrl = sessionId
        ? new URL(`/payment/success?session_id=${encodeURIComponent(sessionId)}`, request.url)
        : new URL("/payment/success", request.url);
      const response = NextResponse.redirect(redirectUrl);
      if (cookie) {
        response.cookies.set(READINESS_ACCESS_COOKIE, cookie.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: cookie.maxAge,
        });
      }
      return response;
    }

    const response = NextResponse.json({ status }, { status: STATUS_HTTP_CODE[status] });
    if (cookie) {
      response.cookies.set(READINESS_ACCESS_COOKIE, cookie.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: cookie.maxAge,
      });
    }
    return response;
  }

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return respond("invalid");
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
    return respond("ready");
  }

  const result = await activateReadinessPayment(sessionId);

  if (result.status !== "ready") {
    return respond(result.status);
  }

  return respond("ready", { token: result.token, maxAge: result.maxAge });
}
