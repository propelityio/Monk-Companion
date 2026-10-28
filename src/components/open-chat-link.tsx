"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { playBell } from "@/lib/bell";
import { getReplyMode } from "@/lib/use-prefs";

/**
 * Link into the chat that rings the bell on the way in. Navigation stays in
 * the page (client-side), so the bell keeps ringing as the chat opens.
 * Visitors who chose text-only replies get silence.
 */
export function OpenChatLink({
  className,
  children,
  lang,
}: {
  className?: string;
  children: ReactNode;
  lang?: string;
}) {
  return (
    <Link
      href="/chat"
      lang={lang}
      className={className}
      onClick={() => {
        if (getReplyMode() !== "text") playBell();
      }}
    >
      {children}
    </Link>
  );
}
