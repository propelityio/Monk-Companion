"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { startFreshConversation } from "@/lib/chat-session";

/** The logo link: goes home and clears the conversation for a fresh start. */
export function HomeLink({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Link href="/" className={className} onClick={() => startFreshConversation()}>
      {children}
    </Link>
  );
}
