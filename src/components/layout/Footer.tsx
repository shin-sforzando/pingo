import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="fixed bottom-0 w-full bg-background/95 backdrop-blur py-4">
      <div className="mx-auto max-w-md px-4 flex flex-col items-center gap-2">
        <Link
          href="/terms"
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {t("termsOfService")}
        </Link>

        <div className="flex items-center gap-2">
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
              className="rounded-full"
            />
          </Link>
          <p className="text-sm text-muted-foreground">
            {t("copyright", { year: 2025 })}
          </p>
        </div>
      </div>
    </footer>
  );
}
