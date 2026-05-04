import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "doPOST",
  description: "자영업자를 위한 스레드 자동 글쓰기 툴",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
