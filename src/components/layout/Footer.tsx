import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="fixed bottom-0 w-full bg-background/70 py-4 backdrop-invert">
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4">
        <Link
          href="/terms"
          className="text-foreground text-sm transition-colors hover:text-primary"
        >
          {t("termsOfService")}
        </Link>

        <div className="flex items-center gap-2">
          <p className="text-foreground text-sm">
            {t("copyright", { year: 2025 })}
          </p>
          <p className="text-xs">produced by</p>
          <Link
            href="https://hacking-papa.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/images/hacking-papa_512x512.png"
              alt="Hacking Papa"
              width={32}
              height={32}
              className="rounded-sm"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
