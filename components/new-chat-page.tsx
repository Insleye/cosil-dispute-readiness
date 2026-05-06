"use client";

import { useState } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ROLE_OPTIONS = [
  "Resident or tenant",
  "Leaseholder",
  "Property owner or landlord",
  "Business or organisation",
];

const COMPLAINT_STAGE_OPTIONS = [
  "Early stage, no formal complaint raised",
  "Complaint raised, awaiting response",
  "Complaint responded to, matter unresolved",
  "Formal process underway or imminent deadline",
];

const FRAMEWORK_ANCHOR =
  "A structured diagnostic produced by Cosil Solutions Ltd, a strategic dispute and risk consultancy and accredited civil and commercial mediation practice.";

const SCOPE_STATEMENT =
  "Cosil works with individuals and organisations across all stages of a dispute, complaint, or risk matter.";

const EXAMPLE_MATTERS =
  "Recent matters include possession disputes, Ombudsman findings, service charge challenges, damp and disrepair, workplace grievances, and commercial contract disputes.";

function inferSegmentFromRole(role: string): "B2C" | "B2B" {
  if (role === "Business or organisation") return "B2B";
  if (role === "Property owner or landlord") return "B2B";
  return "B2C";
}

export function NewChatPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [complaintStage, setComplaintStage] = useState<string | null>(null);
  const id = generateUUID();

  // STEP 1 — Role selection
  if (!userRole) {
    return (
      <div className="mx-auto mt-16 max-w-2xl px-4">
        <h1 className="mb-2 text-2xl font-semibold">Dispute Readiness Check</h1>

        <p className="mb-2 text-sm text-zinc-500">{FRAMEWORK_ANCHOR}</p>

        <p className="mb-1 text-sm text-zinc-600">{SCOPE_STATEMENT}</p>

        <p className="mb-6 text-xs text-zinc-400">{EXAMPLE_MATTERS}</p>

        <p className="mb-4 text-zinc-500">
          Select the description that applies.
        </p>

        <div className="grid gap-3">
          {ROLE_OPTIONS.map((role) => (
            <Button
              key={role}
              variant="outline"
              className="justify-start"
              onClick={() => setUserRole(role)}
            >
              {role}
            </Button>
          ))}
        </div>

        <p className="mt-6 text-xs text-zinc-400">
          This tool produces a position and risk assessment. It does not constitute legal or professional advice.
        </p>
      </div>
    );
  }

  // STEP 2 — Stage selection
  if (!complaintStage) {
    return (
      <div className="mx-auto mt-16 max-w-2xl px-4">
        <h1 className="mb-2 text-2xl font-semibold">Stage of the matter</h1>

        <p className="mb-3 text-sm text-zinc-500">{FRAMEWORK_ANCHOR}</p>

        <p className="mb-6 text-zinc-500">
          Indicate the current stage of the matter.
        </p>

        <div className="grid gap-3">
          {COMPLAINT_STAGE_OPTIONS.map((stage) => (
            <Button
              key={stage}
              variant="outline"
              className="justify-start text-left"
              onClick={() => setComplaintStage(stage)}
            >
              {stage}
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => setUserRole(null)}
        >
          ← Back
        </Button>
      </div>
    );
  }

  const segment = inferSegmentFromRole(userRole);

  // STEP 3 — Show chat with context
  const initialMessages = [
    {
      id: generateUUID(),
      role: "user" as const,
      parts: [
        {
          type: "text" as const,
          text: `Assessment input.
Role: ${userRole}
Segment: ${segment}
Stage: ${complaintStage}

Description of the matter follows.`,
        },
      ],
    },
  ];

  return (
    <>
      <Chat
        id={id}
        initialMessages={initialMessages}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialVisibilityType="private"
        isReadonly={false}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
