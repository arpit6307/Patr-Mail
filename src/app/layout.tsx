import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "Patr (पत्र) — India ka Apna Inbox",
  description:
    "Patr is India's own email platform. Fast, secure, and built for Bharat. Apna Patr ID banao aur shuru karo!",
  keywords: ["patr", "email", "india", "inbox", "indian email", "patr mail"],
  openGraph: {
    title: "Patr (पत्र) — India ka Apna Inbox",
    description:
      "India's own email platform — fast, secure, and proudly made in India.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
