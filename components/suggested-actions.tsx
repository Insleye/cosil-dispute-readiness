"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const segments = [
    {
      label: "Tenant / Resident",
      message:
        "Role: Tenant or resident. Please start by asking me your triage questions. My issue is:",
    },
    {
      label: "Leaseholder",
      message:
        "Role: Leaseholder. Please start by asking me your triage questions. My issue is:",
    },
    {
      label: "Landlord / Freeholder",
      message:
        "Role: Landlord or freeholder. Please start by asking me your triage questions. My issue is:",
    },
    {
      label: "Organisation (HA, LA, Managing Agent)",
      message:
        "Role: Organisation (housing association, local authority, or managing agent). Please start by asking me your triage questions. The case is about:",
    },
  ];

  return (
    <>
      <div className="mb-3 text-sm text-zinc-500">
        Start by choosing what best describes you:
      </div>

      <div
        className="grid w-full gap-2 sm:grid-cols-2"
        data-testid="suggested-actions"
      >
        {segments.map((segment, index) => (
          <motion.div
            key={segment.label}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.05 * index }}
          >
            <Suggestion
              className="h-auto w-full whitespace-normal p-3 text-left"
              suggestion={segment.message}
              onClick={(suggestion) => {
                window.history.pushState({}, "", `/chat/${chatId}`);
                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: suggestion }],
                });
              }}
            >
              {segment.label}
            </Suggestion>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Tip: Click your role, then add one short sentence to complete the line.
      </div>
    </>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;
    return true;
  }
);
