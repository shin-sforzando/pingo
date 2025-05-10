import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");
  return (
    <div className="container mx-auto p-4">
      {/* How to Play section (displayed for all users) */}
      <section className="mx-auto mt-8 max-w-2xl">
        <div className="rounded-lg border bg-card p-6 shadow-md">
          <h2 className="mb-4 font-bold text-xl">{t("howToPlay")}</h2>
          <div className="space-y-4">
            <p>{t("howToPlayDescription")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
