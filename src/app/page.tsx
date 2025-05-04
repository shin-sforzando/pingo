"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/i18n/useTranslation";
import Image from "next/image";

export default function Home() {
  const { t } = useTranslation();

  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <div className="flex justify-between w-full items-center">
        <LanguageSwitcher />
        <Image
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
          style={{
            maxWidth: "100%",
            width: "auto",
            height: "auto",
          }}
        />
      </div>
      <h1 className="text-2xl font-bold">{t("home.welcome")}</h1>
      <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left">
        <li className="mb-2 tracking-[-.01em]">
          {t("home.getStarted")}{" "}
          <code className="bg-black/[.05] px-1 py-0.5 rounded font-semibold">
            src/app/page.tsx
          </code>
          .
        </li>
        <li className="tracking-[-.01em]">{t("home.editFile")}</li>
      </ol>
    </main>
  );
}
