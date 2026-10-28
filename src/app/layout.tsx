import type { Metadata } from "next";
import { Figtree, Marcellus } from "next/font/google";
import "./globals.css";

const sans = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
});

// Inscriptional serif, in the spirit of carved temple lettering. One weight.
const serif = Marcellus({
  variable: "--font-marcellus",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Monk Companion",
    template: "%s · Monk Companion",
  },
  description:
    "An authentic companion from A Way Through Foundation, grounded in Buddhist teachings. Speak or chat with no login required.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
