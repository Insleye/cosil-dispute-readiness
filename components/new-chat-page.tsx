"use client";

import { useState } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ROLE_OPTIONS = [
  "Tenant / Resident",
  "Leaseholder",
  "Landlord",
  "Freeholder",
  "Managing Agent / Property Manager",
  "Housing Association",
  "Local Authority",
];

const COMPLAINT_STAGE_OPTIONS = [
  "No, I have not raised a formal complaint",
  "Yes, complaint raised but no response yet",
  "Yes, complaint responded to but unresolved",
  "Yes, complaint exhausted / final response received",
];

export function NewChatPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [complaintStage, setComplaintStage] = useState<string | null>(null);
  const id = generateUUID();

  // STEP 1 — Role selection
  if (!userRole) {
    return (
      <div className="mx-auto mt-16 max-w-2xl px-4">
        <h1 className="mb-2 text-2xl font-semibold">
          Dispute Readiness Check
        </h1>

        <p className="mb-6 text-zinc-500">
          To give you the right guidance, first tell us which best describes you.
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
      </div>
    );
  }

  // STEP 2 — Complaint stage selection
  if (!complaintStage) {
    return (
      <div className="mx-auto mt-16 max-w-2xl px-4">
        <h1 className="mb-2 text-2xl font-semibold">
          Dispute Readiness Check
        </h1>

        <p className="mb-6 text-zinc-500">
          Have you already raised a formal complaint?
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

  // STEP 3 — Show chat with context
  return (
    <>
      <Chat
        id={id}
        initialMessages={[]}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialVisibilityType="private"
        isReadonly={false}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
