import type { UseChatHelpers } from "@ai-sdk/react";
import { ArrowDownIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { useDataStream } from "./data-stream-provider";
import { Greeting } from "./greeting";
import { PreviewMessage, ThinkingMessage } from "./message";

type MessagesProps = {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  selectedModelId: string;
};

/**
 * COSIL META (internal)
 * We allow the model to include machine-readable tags, but we never show them to the user.
 *
 * Supported examples in assistant output:
 * - [COSIL_TIER: LOW]
 * - [COSIL_TIER: ESCALATING]
 * - [COSIL_TIER: HIGH]
 * - [COSIL_SEGMENT: B2C] / [COSIL_SEGMENT: B2B]
 * - [COSIL_URGENCY: 0-100]
 * - [COSIL_SCORE: 0-100]
 * - [COSIL_TRACK: tier=HIGH;segment=B2C;variant=A]
 * - <COSIL_META>{"tier":"HIGH","segment":"B2C","score":92}</COSIL_META>
 */

type CosilTier = "LOW" | "MEDIUM" | "ESCALATING" | "HIGH";
type CosilSegment = "B2C" | "B2B";

type CosilMeta = {
  tier?: CosilTier;
  segment?: CosilSegment;
  score?: number;
  urgency?: number;
  variant?: string;
  flags?: string[];
};

function clampNumber(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeParseInt(value: string | undefined) {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function extractCosilMetaFromText(text: string): { cleanText: string; meta: CosilMeta } {
  let working = text ?? "";
  const meta: CosilMeta = {};

  // 1) Optional JSON meta block
  //    <COSIL_META>{...}</COSIL_META>
  const jsonBlockRegex = /<COSIL_META>\s*([\s\S]*?)\s*<\/COSIL_META>/gi;
  working = working.replace(jsonBlockRegex, (_match, jsonStr) => {
    try {
      const parsed = JSON.parse(String(jsonStr));
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.tier === "string") meta.tier = parsed.tier.toUpperCase();
        if (typeof parsed.segment === "string") meta.segment = parsed.segment.toUpperCase();
        if (typeof parsed.score === "number") meta.score = clampNumber(parsed.score, 0, 100);
        if (typeof parsed.urgency === "number") meta.urgency = clampNumber(parsed.urgency, 0, 100);
        if (typeof parsed.variant === "string") meta.variant = parsed.variant;
        if (Array.isArray(parsed.flags)) meta.flags = parsed.flags.map(String);
      }
    } catch {
      // ignore bad JSON
    }
    return "";
  });

  // 2) Bracket tags e.g. [COSIL_TIER: HIGH]
  // Remove only the tags, keep the rest of content untouched.
  const tagRegex = /\[(COSIL[_-][A-Z_]+)\s*:\s*([^\]]+)\]/gi;

  working = working.replace(tagRegex, (_match, rawKey, rawValue) => {
    const key = String(rawKey).toUpperCase().replace("COSIL-", "COSIL_");
    const value = String(rawValue).trim();

    if (key === "COSIL_TIER") {
      const v = value.toUpperCase();
      // Allow MEDIUM even if not currently used, for future-proofing.
      if (v === "LOW" || v === "MEDIUM" || v === "ESCALATING" || v === "HIGH") {
        meta.tier = v as CosilTier;
      }
    }

    if (key === "COSIL_SEGMENT") {
      const v = value.toUpperCase();
      if (v === "B2C" || v === "B2B") meta.segment = v as CosilSegment;
    }

    if (key === "COSIL_SCORE") {
      const n = safeParseInt(value);
      if (typeof n === "number") meta.score = clampNumber(n, 0, 100);
    }

    if (key === "COSIL_URGENCY") {
      const n = safeParseInt(value);
      if (typeof n === "number") meta.urgency = clampNumber(n, 0, 100);
    }

    if (key === "COSIL_VARIANT") {
      if (value) meta.variant = value;
    }

    if (key === "COSIL_FLAG") {
      meta.flags = Array.isArray(meta.flags) ? meta.flags : [];
      meta.flags.push(value);
    }

    if (key === "COSIL_TRACK") {
      // Accept semi-colon key pairs: tier=HIGH;segment=B2C;variant=A
      const parts = value.split(";").map((s) => s.trim()).filter(Boolean);
      for (const p of parts) {
        const [kRaw, ...rest] = p.split("=");
        const k = (kRaw ?? "").trim().toLowerCase();
        const v = rest.join("=").trim();
        if (!k || !v) continue;

        if (k === "tier") {
          const vv = v.toUpperCase();
          if (vv === "LOW" || vv === "MEDIUM" || vv === "ESCALATING" || vv === "HIGH") {
            meta.tier = vv as CosilTier;
          }
        }

        if (k === "segment") {
          const vv = v.toUpperCase();
          if (vv === "B2C" || vv === "B2B") meta.segment = vv as CosilSegment;
        }

        if (k === "score") {
          const n = safeParseInt(v);
          if (typeof n === "number") meta.score = clampNumber(n, 0, 100);
        }

        if (k === "urgency") {
          const n = safeParseInt(v);
          if (typeof n === "number") meta.urgency = clampNumber(n, 0, 100);
        }

        if (k === "variant") {
          meta.variant = v;
        }

        if (k === "flag") {
          meta.flags = Array.isArray(meta.flags) ? meta.flags : [];
          meta.flags.push(v);
        }
      }
    }

    // Always remove the tag from user-visible output
    return "";
  });

  // Clean up spacing after tag removals
  working = working.replace(/^\s+/, "");
  working = working.replace(/\n{3,}/g, "\n\n");

  return { cleanText: working.trim(), meta };
}

function stripCosilMetaFromMessage(message: ChatMessage): ChatMessage {
  // Only strip on assistant messages
  if (message.role !== "assistant" || !message.parts?.length) return message;

  let aggregatedMeta: CosilMeta = {};

  const newParts = message.parts.map((part) => {
    if (part?.type !== "text") return part;

    const { cleanText, meta } = extractCosilMetaFromText(part.text ?? "");
    aggregatedMeta = {
      ...aggregatedMeta,
      ...meta,
      // merge flags if both exist
      flags: Array.isArray(aggregatedMeta.flags) || Array.isArray(meta.flags)
        ? Array.from(new Set([...(aggregatedMeta.flags ?? []), ...(meta.flags ?? [])]))
        : undefined,
    };

    return { ...part, text: cleanText };
  });

  // Attach meta in a non-breaking way for downstream UI (CTA logic, analytics, etc.)
  // This keeps TypeScript happy (we do not change the public type), but still allows access.
  const enriched = { ...message, parts: newParts } as ChatMessage & { __cosilMeta?: CosilMeta };
  enriched.__cosilMeta = aggregatedMeta;

  return enriched;
}

function PureMessages({
  addToolApprovalResponse,
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  selectedModelId: _selectedModelId,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    scrollToBottom,
    hasSentMessage,
  } = useMessages({
    status,
  });

  useDataStream();

  // Create a display-safe copy of messages (no COSIL internal tags shown to users)
  const displayMessages = useMemo(() => {
    return messages.map(stripCosilMetaFromMessage);
  }, [messages]);

  // Emit a lightweight browser event when we receive COSIL meta, so CTAs/analytics can listen.
  useEffect(() => {
    const last = displayMessages.at(-1) as (ChatMessage & { __cosilMeta?: CosilMeta }) | undefined;
    if (!last || last.role !== "assistant") return;

    const meta = last.__cosilMeta;
    if (!meta) return;

    const hasUsefulMeta = Boolean(meta.tier || meta.segment || meta.score || meta.urgency || meta.variant);
    if (!hasUsefulMeta) return;

    window.dispatchEvent(
      new CustomEvent("cosil:meta", {
        detail: {
          chatId,
          messageId: last.id,
          ...meta,
        },
      })
    );
  }, [displayMessages, chatId]);

  return (
    <div className="relative flex-1">
      <div
        className="absolute inset-0 touch-pan-y overflow-y-auto"
        ref={messagesContainerRef}
      >
        <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
          {displayMessages.length === 0 && <Greeting />}

          {displayMessages.map((message, index) => (
            <PreviewMessage
              addToolApprovalResponse={addToolApprovalResponse}
              chatId={chatId}
              isLoading={status === "streaming" && displayMessages.length - 1 === index}
              isReadonly={isReadonly}
              key={message.id}
              message={message}
              regenerate={regenerate}
              requiresScrollPadding={hasSentMessage && index === displayMessages.length - 1}
              setMessages={setMessages}
              vote={
                votes ? votes.find((vote) => vote.messageId === message.id) : undefined
              }
            />
          ))}

          {status === "submitted" &&
            !displayMessages.some((msg) =>
              msg.parts?.some(
                (part) => "state" in part && part.state === "approval-responded"
              )
            ) && <ThinkingMessage />}

          <div className="min-h-[24px] min-w-[24px] shrink-0" ref={messagesEndRef} />
        </div>
      </div>

      <button
        aria-label="Scroll to bottom"
        className={`absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted ${
          isAtBottom
            ? "pointer-events-none scale-0 opacity-0"
            : "pointer-events-auto scale-100 opacity-100"
        }`}
        onClick={() => scrollToBottom("smooth")}
        type="button"
      >
        <ArrowDownIcon className="size-4" />
      </button>
    </div>
  );
}

export const Messages = PureMessages;
