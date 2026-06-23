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
      <body className={`${jakarta.variable} antialiased min-h-screen`} style={{ background: "#fff" }}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
