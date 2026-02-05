// lib/cosil/meta.ts
// -----------------------------------------------------------------------------
// COSIL internal meta + conversion tracking helpers
//
// Purpose:
// 1) Allow the model to include invisible internal scoring + tier/segment
// 2) Strip that meta from the visible assistant message
// 3) Append tracking parameters to Cosil CTAs so you can see which tier converts
//
// Expected hidden first-line format (must be first line of assistant output):
// [[COSIL_META tier=HIGH score=85 segment=B2C flags=tribunal,hearing_soon]]
// -----------------------------------------------------------------------------

export type CosilTier = "LOW" | "ESCALATING" | "HIGH";
export type CosilSegment = "B2C" | "B2B";

export type CosilMeta = {
  tier: CosilTier;
  score: number; // 0–100
  segment: CosilSegment;
  flags: string[];
};

const META_PREFIX_RE =
  /^\s*\[\[COSIL_META\s+([^\]]+)\]\]\s*\n?/i;

// Parses "tier=HIGH score=85 segment=B2C flags=a,b,c"
function parseMetaKV(raw: string): CosilMeta | null {
  const kv: Record<string, string> = {};

  for (const part of raw.split(/\s+/).filter(Boolean)) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    kv[key] = value;
  }

  const tierRaw = (kv["tier"] || "").toUpperCase();
  const segmentRaw = (kv["segment"] || "").toUpperCase();

  const tier: CosilTier =
    tierRaw === "HIGH" || tierRaw === "ESCALATING" || tierRaw === "LOW"
      ? (tierRaw as CosilTier)
      : "LOW";

  const segment: CosilSegment =
    segmentRaw === "B2B" || segmentRaw === "B2C"
      ? (segmentRaw as CosilSegment)
      : "B2C";

  const scoreNum = Number(kv["score"]);
  const score = Number.isFinite(scoreNum)
    ? Math.min(100, Math.max(0, Math.round(scoreNum)))
    : 0;

  const flags = (kv["flags"] || "")
    .split(",")
    .map((f) => f.trim().toLowerCase())
    .filter(Boolean);

  return { tier, score, segment, flags };
}

/**
 * Strips internal COSIL meta from the assistant message so it never shows to users.
 * Returns both the clean user-facing text and the parsed meta (if present).
 */
export function stripCosilMeta(text: string): {
  cleanText: string;
  meta: CosilMeta | null;
} {
  if (!text) return { cleanText: text, meta: null };

  const match = text.match(META_PREFIX_RE);
  if (!match) return { cleanText: text, meta: null };

  const metaRaw = match[1] || "";
  const meta = parseMetaKV(metaRaw);

  const cleanText = text.replace(META_PREFIX_RE, "");
  return { cleanText, meta };
}

/**
 * Adds tier/segment/score/flags tracking to Cosil URLs.
 * Use this for CTA buttons (Contact, Request review, Readiness page etc.).
 *
 * Example output:
 * https://cosilsolutions.co.uk/contact?src=readiness&tier=HIGH&segment=B2C&score=85&flags=tribunal,hearing_soon
 */
export function withCosilTracking(url: string, meta: CosilMeta | null): string {
  try {
    // Works both client and server side
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://cosilsolutions.co.uk";

    const u = new URL(url, base);

    u.searchParams.set("src", "readiness");

    if (meta) {
      u.searchParams.set("tier", meta.tier);
      u.searchParams.set("segment", meta.segment);
      u.searchParams.set("score", String(meta.score));
      if (meta.flags.length) {
        u.searchParams.set("flags", meta.flags.join(","));
      }
    }

    return u.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Lightweight helper if you want a single "conversion key" for analytics events.
 * Example: "HIGH|B2C|85"
 */
export function cosilConversionKey(meta: CosilMeta | null): string {
  if (!meta) return "UNKNOWN";
  return `${meta.tier}|${meta.segment}|${meta.score}`;
}
