// lib/cosil/meta.ts

export type CosilMeta = {
  tier: "LOW" | "ESCALATING" | "HIGH";
  score: number;
  segment: "B2C" | "B2B";
  flags: string[];
};

/**
 * Matches:
 * [[COSIL_META tier=HIGH score=85 segment=B2C flags=tribunal,hearing_soon]]
 */
const COSIL_META_RE =
  /^\[\[COSIL_META\s+tier=(LOW|ESCALATING|HIGH)\s+score=(\d{1,3})\s+segment=(B2C|B2B)\s+flags=([a-z0-9_,\-]*)\]\]\s*\n?/i;

/**
 * Removes internal COSIL meta from AI output before display
 * and returns parsed metadata for CTAs, tracking, logic.
 */
export function stripCosilMeta(text: string): {
  cleanText: string;
  meta: CosilMeta | null;
} {
  const match = text.match(COSIL_META_RE);

  if (!match) {
    return { cleanText: text, meta: null };
  }

  const tier = match[1].toUpperCase() as CosilMeta["tier"];
  const score = Math.min(100, Math.max(0, Number(match[2] || 0)));
  const segment = match[3].toUpperCase() as CosilMeta["segment"];
  const flagsRaw = match[4] || "";

  const flags = flagsRaw
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  const cleanText = text.replace(COSIL_META_RE, "");

  return {
    cleanText,
    meta: { tier, score, segment, flags },
  };
}

/**
 * Adds tier/segment/score tracking to Cosil links
 * so you can see which tier converts best.
 */
export function withCosilTracking(
  url: string,
  meta: CosilMeta | null
): string {
  try {
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
    return url;
  }
}
