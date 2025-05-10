import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
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
          <div className="-z-10 fixed inset-0">
            <AnimatedGridPattern
              className="[mask-image:radial-gradient(500px_circle_at_center,transparent,white)]"
              width={64}
              height={64}
              numSquares={10}
              maxOpacity={0.2}
              duration={5}
              repeatDelay={1}
            />
          </div>
          <Header />
          <main className="relative mx-auto max-w-md px-4 pb-24">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
