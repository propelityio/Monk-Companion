"use client";

import { UI } from "@/lib/i18n";
import { useLocale } from "@/lib/use-prefs";
import { OpenChatLink } from "./open-chat-link";

/** Header link to the chat, in the visitor's chosen language. */
export function ChatNavLink() {
  const locale = useLocale();
  return (
    <OpenChatLink
      lang={locale}
      className="rounded-full px-1.5 py-1.5 text-[var(--maroon)] sm:px-3 transition-colors hover:bg-[var(--maroon-soft)]"
    >
      {UI[locale].chatTitle}
    </OpenChatLink>
  );
}
