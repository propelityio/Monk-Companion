import { ChatHost } from "@/components/chat-host";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Monk Chat",
};

export default function ChatPage() {
  return (
    // Exactly the screen's height: the conversation scrolls, while the message
    // box and the footer stay in view.
    <div className="flex h-dvh flex-col">
      <SiteHeader />
      <ChatHost />
      <SiteFooter compact showCrisisNote={false} />
    </div>
  );
}
