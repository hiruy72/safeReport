import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "SafeHer — Secure Reporting Platform",
  description: "Report gender-based violence anonymously with verified identity protection.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} antialiased min-h-screen`} style={{ background: "#fdf6e9" }}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

// _rev: 639202313490000000

// Commit: Add e2e test scaffold with Playwright - 2026-08-06T16:05:07

// Commit: Add toast notification system - 2026-08-24T07:53:20

// Commit: Add rate limiting middleware to API - 2026-09-07T08:44:17
