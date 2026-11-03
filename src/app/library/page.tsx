import { Suspense } from "react";
import { LibraryView } from "@/components/library-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Library",
  description: "Recorded Buddhist talks and podcasts, to watch and listen to inside Monk Companion.",
};

export default function LibraryPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <Suspense fallback={<div className="flex-1" />}>
        <LibraryView />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
