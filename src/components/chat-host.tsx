"use client";

import { useConversationSession } from "@/lib/chat-session";
import { MonkChat } from "./monk-chat";

/** The chat, rebuilt from scratch whenever a fresh conversation is started. */
export function ChatHost() {
  const session = useConversationSession();
  return <MonkChat key={session} />;
}
