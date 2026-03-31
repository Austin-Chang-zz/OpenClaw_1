import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenClaw – AI Content Production System",
  description: "Secure, AI-driven content production and research automation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
