import { cookies } from "next/headers";
import { Suspense } from "react";
import DisputeReadinessGate from "./dispute-readiness-gate";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <NewChatPage />
    </Suspense>
  );
}

async function NewChatPage() {
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  const initialChatModel = modelIdFromCookie?.value ?? DEFAULT_CHAT_MODEL;

  return <DisputeReadinessGate initialChatModel={initialChatModel} />;
}
