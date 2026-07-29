import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ことばガーデン",
  description: "毎日少しずつ日本語の庭を育てるN5学習アプリ。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
