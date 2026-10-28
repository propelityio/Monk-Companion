import { ChatHost } from "@/components/chat-host";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Monk Chat",
};

export default function ChatPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <ChatHost />
    </div>
  );
}
