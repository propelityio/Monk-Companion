import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PlaceholderPage title="About">
      <p>
        Monk Companion is offered by A Way Through Foundation: a companion for anyone seeking
        Buddhist teachings, wherever they are.
      </p>
      <p className="text-base text-[var(--muted)]">More about the foundation is coming soon.</p>
    </PlaceholderPage>
  );
}
