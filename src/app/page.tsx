import { LandingContent } from "@/components/landing-content";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <LandingContent />
      <SiteFooter />
    </div>
  );
}
