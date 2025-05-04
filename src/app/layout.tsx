import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Common");

  return {
    title: t("appName"),
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className={"antialiased"}>
        <NextIntlClientProvider locale={locale}>
          <main>{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
