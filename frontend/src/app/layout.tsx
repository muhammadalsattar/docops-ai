import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocOps AI — Bilingual Document RAG & Approval Ops",
  description:
    "Enterprise EN/AR RTL Document RAG workspace with clickable source citations, RBAC-gated approval workflows, and immutable audit trails.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
