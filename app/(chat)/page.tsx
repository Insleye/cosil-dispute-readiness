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

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <NewChatPage />
    </Suspense>
  );
}

function NewChatPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const id = generateUUID();

  // STEP 1 — Force role selection
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

  // STEP 2 — Load chat with role injected as first message
  return <ChatWithRole id={id} userRole={userRole} />;
}

function ChatWithRole({
  id,
  userRole,
}: {
  id: string;
  userRole: string;
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
          text: `I am a ${userRole}. I need help with a dispute.`,
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
