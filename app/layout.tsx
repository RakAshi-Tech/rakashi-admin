import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RakAshi Admin",
  description: "RakAshi Driver Management Admin Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
