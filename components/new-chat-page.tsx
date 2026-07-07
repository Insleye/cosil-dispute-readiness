"use client";

import { useState } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ROLE_OPTIONS = [
  "Housing provider, managing agent or local authority",
  "Professional adviser or referral partner",
  "Business or organisation",
  "Resident, tenant or leaseholder",
  "Property owner or landlord",
];

const MATTER_STAGE_OPTIONS = [
  "Early concern, no formal process started",
  "Complaint, correspondence or internal review underway",
  "Response received, matter remains unresolved",
  "Ombudsman, tribunal, mediation, hearing or deadline approaching",
];

const FRAMEWORK_ANCHOR =
  "A structured diagnostic from Cosil Solutions Ltd, a consultancy and accredited mediation practice for housing, property, complaints, governance, risk and dispute resolution matters.";

const SCOPE_STATEMENT =
  "Cosil helps organisations, businesses and individuals understand where a matter sits, what risk is forming and what proportionate route is needed next.";

const EXAMPLE_MATTERS =
  "Typical matters include escalated housing complaints, Ombudsman pressure, leasehold and service charge disputes, disrepair, governance concerns, mediation preparation, tribunal preparation and commercial disputes.";

function inferSegmentFromRole(role: string): "B2C" | "B2B" {
  if (role === "Resident, tenant or leaseholder") return "B2C";
  return "B2B";
}

export function NewChatPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [matterStage, setMatterStage] = useState<string | null>(null);
  const id = generateUUID();

  if (!userRole) {
    return (
      <div className="mx-auto mt-16 max-w-2xl px-4">
        <h1 className="mb-2 text-2xl font-semibold">Dispute Readiness Check</h1>

        <p className="mb-2 text-sm text-zinc-500">{FRAMEWORK_ANCHOR}</p>

        <p className="mb-1 text-sm text-zinc-600">{SCOPE_STATEMENT}</p>

        <p className="mb-6 text-xs text-zinc-400">{EXAMPLE_MATTERS}</p>

        <p className="mb-4 text-zinc-500">
          Select the description closest to your position.
        </p>

        <div className="grid gap-3">
          {ROLE_OPTIONS.map((role) => (
            <Button
              key={role}
              variant="outline"
              className="h-auto justify-start whitespace-normal py-3 text-left"
              onClick={() => setUserRole(role)}
            >
              {role}
            </Button>
          ))}
        </div>

        <p className="mt-6 text-xs text-zinc-400">
          This check gives an initial diagnostic view. It does not replace a formal instruction, legal advice or mediation appointment.
        </p>
      </div>
    );
  }

  if (!matterStage) {
    return (
      <div className="mx-auto mt-16 max-w-2xl px-4">
        <h1 className="mb-2 text-2xl font-semibold">Stage of the matter</h1>

        <p className="mb-3 text-sm text-zinc-500">{FRAMEWORK_ANCHOR}</p>

        <p className="mb-6 text-zinc-500">
          Indicate where the matter currently sits.
        </p>

        <div className="grid gap-3">
          {MATTER_STAGE_OPTIONS.map((stage) => (
            <Button
              key={stage}
              variant="outline"
              className="h-auto justify-start whitespace-normal py-3 text-left"
              onClick={() => setMatterStage(stage)}
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
          Back
        </Button>
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
Stage: ${matterStage}

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
