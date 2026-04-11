import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fumi",
  description: "Write once. Deliver everywhere. — Global content platform for creators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
