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

function detectTierFromAssistantText(textRaw: string): RiskTier {
  const text = (textRaw || "").trim();

  const marker = text.match(/\[COSIL_TIER:\s*(LOW|ESCALATING|HIGH)\s*\]/i);
  if (marker?.[1]) return marker[1].toUpperCase() as RiskTier;

  const tierLine =
    text.match(/^\s*Tier\s*[:\n]\s*(LOW RISK|ESCALATING|HIGH RISK)\s*$/im)?.[1] ??
    text.match(/^\s*Tier\s*[:\n]\s*(LOW|ESCALATING|HIGH)\s*$/im)?.[1];

  if (tierLine) {
    const t = tierLine.toUpperCase();
    if (t.includes("HIGH")) return "HIGH";
    if (t.includes("ESCALATING")) return "ESCALATING";
    if (t.includes("LOW")) return "LOW";
  }

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
    transport: new DefaultChatTransport
