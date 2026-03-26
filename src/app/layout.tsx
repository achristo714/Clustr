import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clustr - PDF Notes Synthesizer",
  description:
    "Drop in your conference notes and discover patterns, connections, and insights across documents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0f] antialiased">{children}</body>
    </html>
  );
}
