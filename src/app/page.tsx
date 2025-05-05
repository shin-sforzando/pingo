import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <div>
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
    </div>
  );
}
