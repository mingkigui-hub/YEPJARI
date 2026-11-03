import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "옆자리 — 천천히, 가까워지는 곳",
  description:
    "가명으로 만나는 작은 3D 마을. 느티나무 광장을 산책하고, 벤치에 앉아 쉬고, 이웃의 이야기를 만나보세요.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f1e8",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
