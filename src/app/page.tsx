import { useTranslations } from "next-intl";
import Image from "next/image";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
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
      <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left">
        <li className="mb-2 tracking-[-.01em]">
          {t("getStarted")}{" "}
          <code className="bg-black/[.05] px-1 py-0.5 rounded font-semibold">
            src/app/page.tsx
          </code>
          .
        </li>
        <li className="tracking-[-.01em]">{t("saveChanges")}</li>
      </ol>
    </main>
  );
}
