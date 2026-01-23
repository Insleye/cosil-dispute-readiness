import { cookies } from "next/headers";
import { Suspense } from "react";
import DisputeReadinessGate from "./dispute-readiness-gate";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <ServerWrapper />
    </Suspense>
  );
}

async function ServerWrapper() {
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model")?.value;

  return (
    <DisputeReadinessGate
      initialChatModel={modelIdFromCookie || DEFAULT_CHAT_MODEL}
    />
  );
}
