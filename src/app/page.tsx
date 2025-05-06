import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <>
      <ol className="list-inside list-decimal text-sm/6">
        <li className="mb-2 tracking-[-.01em]">{t("editFile")}</li>
        <li className="tracking-[-.01em]">{t("saveChanges")}</li>
      </ol>
    </>
  );
}
