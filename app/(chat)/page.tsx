import { Suspense } from "react";
import { NewChatPage } from "@/components/new-chat-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <NewChatPage />
    </Suspense>
  );
}
