import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Send — Job Application Mailer",
  description: "Send job application emails from a template.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-ink-900 antialiased">{children}</body>
    </html>
  );
}
