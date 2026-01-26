"use client";

import { useMemo, useState } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { Button } from "@/components/ui/button";
import { generateUUID } from "@/lib/utils";

const ROLE_OPTIONS = [
  "Tenant / Resident",
  "Leaseholder",
  "Landlord",
  "Freeholder",
  "Managing Agent / Property Manager",
  "Housing Association",
  "Local Authority",
] as const;

const COMPLAINT_STAGE_OPTIONS = [
  "No, I have not raised a formal complaint",
  "Yes, complaint raised but no response yet",
  "Yes, complaint responded to but unresolved",
  "Yes, complaint exhausted / final response received",
] as const;

type Props = {
  initialChatModel: string;
};

export default function DisputeReadinessGate({ initialChatModel }: Props) {
  const [userRole, setUserRole] = useState<(typeof ROLE_OPTIONS)[number] | null>(
    null
  );
  const [complaintStage, setComplaintStage] = useState<
    (typeof COMPLAINT_STAGE_OPTIONS)[number] | null
  >(null);

  const chatId = useMemo(() => generateUUID(), []);

  // Step 1: role
  if (!userRole) {
    return (
      <div className="mx-auto mt-16 max-w-2xl px-4">
        <h1 className="mb-2 text-2xl font-semibold">Dispute Readiness Check</h1>

        <p className="mb-6 text-zinc-500">
          To give you the right guidance, tell us which best describes you.
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
          This tool provides general strategic guidance, not legal advice.
        </p>
      </div>
    );
  }

  // Step 2: complaint stage
  if (!complaintStage) {
    return (
      <div className="mx-auto mt-16 max-w-2xl px-4">
        <h1 className="mb-2 text-2xl font-semibold">Complaint stage check</h1>

        <p className="mb-6 text-zinc-500">
          Where are you currently in the complaints process?
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

  // Step 3: open chat with forced context
  const initialMessages = [
    {
      id: generateUUID(),
      role: "user",
      parts: [
        {
          type: "text",
          text: `Role: ${userRole}\nComplaint stage: ${complaintStage}\nWhat I need help with: (I will explain next).`,
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
