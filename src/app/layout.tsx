import { LocaleProvider } from "@/i18n/LocaleContext";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pingo",
  description: "Bingo game where AI judges based on photos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={"antialiased"}>
        <LocaleProvider>
          <main>{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
