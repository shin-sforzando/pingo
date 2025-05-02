import type { Metadata } from "next";
import "@/app/globals.css";

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
    <html lang="en">
      <body className={"antialiased"}>
        <main>{children}</main>
      </body>
    </html>
  );
}
