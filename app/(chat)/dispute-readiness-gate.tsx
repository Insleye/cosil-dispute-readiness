"use client"; // v4

import { useMemo, useState } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { Button } from "@/components/ui/button";
import { generateUUID } from "@/lib/utils";

const ROLE_OPTIONS = [
  "Resident or tenant",
  "Leaseholder",
  "Property owner or landlord",
  "Organisation",
] as const;

const COMPLAINT_STAGE_OPTIONS = [
  "Early stage, no formal complaint raised",
  "Complaint raised, awaiting response",
  "Complaint responded to, matter unresolved",
  "Formal process underway or imminent deadline",
] as const;

type Props = {
  initialChatModel: string;
};

function inferSegmentFromRole(
  role: (typeof ROLE_OPTIONS)[number]
): "B2C" | "B2B" {
  if (role === "Organisation") return "B2B";
  if (role === "Property owner or landlord") return "B2B";
  return "B2C";
}

const FRAMEWORK_ANCHOR =
  "A structured diagnostic produced by Cosil Solutions Ltd, a strategic dispute and risk consultancy and accredited civil and commercial mediation practice. V2.";

export default function DisputeReadinessGate({ initialChatModel }: Props) {
  const [userRole, setUserRole] = useState<(typeof ROLE_OPTIONS)[number] | null>(
    null
  );
  const [complaintStage, setComplaintStage] = useState<(typeof COMPLAINT_STAGE_OPTIONS)[number] | null>(
    null
  );

  const chatId = useMemo(() => generateUUID(), []);

  if (!userRole) {
    return (
      <div className="mx-auto mt-16 max-w-2xl px-4">
        <h1 className="mb-2 text-2xl font-semibold">Dispute Readiness Check</h1>

        <p className="mb-3 text-sm text-zinc-500">{FRAMEWORK_ANCHOR}</p>

        <p className="mb-6 text-zinc-500">
          Select the description that applies. The assessment will be calibrated accordingly.
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
              className="justify-start"
              onClick={() => setComplaintStage(stage)}
            >
              {stage}
            </Button>
          ))}
        </div>

        <div className="mt-6">
          <Button
            variant="ghost"
            className="px-0 text-sm text-zinc-500 hover:bg-transparent"
            onClick={() => setUserRole(null)}
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  const segment = inferSegmentFromRole(userRole);

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
        autoResume={false}
        id={chatId}
        initialChatModel={initialChatModel}
        initialMessages={initialMessages}
        initialVisibilityType="private"
        isReadonly={false}
        key={chatId}
      />
      <DataStreamHandler />
    </>
  );
}
