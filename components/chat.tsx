"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatHeader } from "@/components/chat-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";

type RiskTier = "LOW" | "ESCALATING" | "HIGH" | null;

function extractTextFromMessage(msg: ChatMessage | undefined): string {
  if (!msg?.parts?.length) return "";
  return msg.parts
    .map((p: any) => (p?.type === "text" && typeof p.text === "string" ? p.text : ""))
    .filter(Boolean)
    .join("\n");
}

/**
 * Tier detection strategy:
 * 1) Preferred: [COSIL_TIER: HIGH|ESCALATING|LOW]
 * 2) Fallback: parse the structured output you forced (Tier section)
 * 3) Extra fallback: look for "HIGH RISK" etc near the start
 */
function detectTierFromAssistantText(textRaw: string): RiskTier {
  const text = (textRaw || "").trim();

  // 1) Marker pattern
  const marker = text.match(/\[COSIL_TIER:\s*(LOW|ESCALATING|HIGH)\s*\]/i);
  if (marker?.[1]) return marker[1].toUpperCase() as RiskTier;

  // 2) "Tier" section (your forced structure)
  // examples: "Tier\nHIGH RISK" or "Tier: HIGH RISK"
  const tierLine =
    text.match(/^\s*Tier\s*[:\n]\s*(LOW RISK|ESCALATING|HIGH RISK)\s*$/im)?.[1] ??
    text.match(/^\s*Tier\s*[:\n]\s*(LOW|ESCALATING|HIGH)\s*$/im)?.[1];

  if (tierLine) {
    const t = tierLine.toUpperCase();
    if (t.includes("HIGH")) return "HIGH";
    if (t.includes("ESCALATING")) return "ESCALATING";
    if (t.includes("LOW")) return "LOW";
  }

  // 3) Extra fallback
  const head = text.slice(0, 400).toUpperCase();
  if (head.includes("HIGH RISK")) return "HIGH";
  if (head.includes("ESCALATING")) return "ESCALATING";
  if (head.includes("LOW RISK")) return "LOW";

  return null;
}

function getLatestAssistantTier(messages: ChatMessage[]): RiskTier {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m?.role === "assistant") {
      const text = extractTextFromMessage(m);
      const tier = detectTierFromAssistantText(text);
      if (tier) return tier;
    }
  }
  return null;
}

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
}) {
  const router = useRouter();

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      router.refresh();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
    addToolApprovalResponse,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    generateId: generateUUID,
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      const shouldContinue =
        lastMessage?.parts?.some(
          (part) =>
            "state" in part &&
            part.state === "approval-responded" &&
            "approval" in part &&
            (part.approval as { approved?: boolean })?.approved === true
        ) ?? false;
      return shouldContinue;
    },
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);
        const isToolApprovalContinuation =
          lastMessage?.role !== "user" ||
          request.messages.some((msg) =>
            msg.parts?.some((part) => {
              const state = (part as { state?: string }).state;
              return state === "approval-responded" || state === "output-denied";
            })
          );

        return {
          body: {
            id: request.id,
            ...(isToolApprovalContinuation
              ? { messages: request.messages }
              : { message: lastMessage }),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        if (error.message?.includes("AI Gateway requires a valid credit card")) {
          setShowCreditCardAlert(true);
        } else {
          toast({
            type: "error",
            description: error.message,
          });
        }
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  // --- Tier-based CTA block (UI-led escalation) ---
  const readinessTier: RiskTier = useMemo(() => {
    return getLatestAssistantTier(messages);
  }, [messages]);

  const isEscalationVisible = readinessTier === "HIGH" || readinessTier === "ESCALATING";

  const contactUrl = "https://cosilsolutions.co.uk/contact/";
  const readinessUrl =
    "https://cosilsolutions.co.uk/dispute-readiness-check-for-property-housing-disputes/";

  const mailto = "mailto:admin@cosilsolution.co.uk";
  const telMain = "tel:+442074584707";
  const telMobile = "tel:+447587065511";

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          selectedVisibilityType={initialVisibilityType}
        />

        <Messages
          addToolApprovalResponse={addToolApprovalResponse}
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={initialChatModel}
          setMessages={setMessages}
          status={status}
          votes={votes}
        />

        {/* Tier-based escalation block (appears only after assistant produces a tier) */}
        {isEscalationVisible && (
          <div className="mx-auto w-full max-w-4xl px-2 pb-2 md:px-4">
            <div className="rounded-lg border bg-background p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-sm">
                  <div className="font-medium">
                    {readinessTier === "HIGH"
                      ? "Time-critical support recommended"
                      : "Optional support to prevent escalation"}
                  </div>
                  <div className="mt-1 text-zinc-500">
                    {readinessTier === "HIGH"
                      ? "If you want structured help to regain control quickly, you can contact Cosil now."
                      : "If you want a structured review and next-step plan, you can request support."}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {readinessTier === "HIGH" ? (
                    <>
                      <Button
                        onClick={() => window.open(contactUrl, "_blank")}
                      >
                        Contact Cosil
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(readinessUrl, "_blank")}
                      >
                        Review options
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => window.open(contactUrl, "_blank")}
                      >
                        Request a dispute review
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(readinessUrl, "_blank")}
                      >
                        Readiness page
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => window.location.href = mailto}
                  >
                    Email
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => (window.location.href = telMain)}
                  >
                    Call
                  </Button>
                </div>
              </div>

              <div className="mt-2 text-xs text-zinc-500">
                admin@cosilsolution.co.uk · 0207 458 4707 · 07587 065511
              </div>
            </div>
          </div>
        )}

        <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          {!isReadonly && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              selectedVisibilityType={visibilityType}
              sendMessage={sendMessage}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
            />
          )}
        </div>
      </div>

      <Artifact
        addToolApprovalResponse={addToolApprovalResponse}
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={votes}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
