import { cookies } from "next/headers";
import { Suspense } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <NewChatPage />
    </Suspense>
  );
}

function NewChatPage() {
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

        <p className="mt-6 text-xs text-zinc-400">
          This tool provides general strategic guidance, not legal advice.
        </p>
      </div>
    );
  }

  // STEP 2 — Complaint stage selection
  if (!complaintStage) {
    return (
      <div className="mx-auto mt-16 max-w-2xl px-4">
        <h1 className="mb-2 text-2xl font-semibold">
          Complaint stage check
        </h1>

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
      </div>
    );
  }

  // STEP 3 — Load chat with forced context
  return (
    <ChatWithContext
      id={id}
      userRole={userRole}
      complaintStage={complaintStage}
    />
  );
}

function ChatWithContext({
  id,
  userRole,
  complaintStage,
}: {
  id: string;
  userRole: string;
  complaintStage: string;
}) {
  const cookieStore = cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  const initialMessages = [
    {
      id: generateUUID(),
      role: "user",
      parts: [
        {
          type: "text",
          text: `I am a ${userRole}. Complaint stage: ${complaintStage}. I need help with a dispute.`,
        },
      ],
    },
  ];

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={
          modelIdFromCookie?.value || DEFAULT_CHAT_MODEL
        }
        initialMessages={initialMessages}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}
