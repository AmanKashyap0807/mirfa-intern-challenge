import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mirfa Secure Transactions",
  description: "Phase 1 scaffold for the Mirfa Secure Transactions mini-app.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
