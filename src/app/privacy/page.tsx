import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <PlaceholderPage title="Privacy Policy">
      <p>Our privacy policy is being prepared and will be published here soon.</p>
      <p className="text-base text-[var(--muted)]">
        It will explain what Monk Companion keeps, what stays only in your browser, and which
        services help answer your messages.
      </p>
    </PlaceholderPage>
  );
}
