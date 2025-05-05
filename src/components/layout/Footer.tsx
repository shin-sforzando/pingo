import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="fixed bottom-0 w-full bg-background/70 backdrop-invert py-4">
      <div className="mx-auto max-w-md px-4 flex flex-col items-center gap-2">
        <Link
          href="/terms"
          className="text-sm text-foreground hover:text-primary transition-colors"
        >
          {t("termsOfService")}
        </Link>

        <div className="flex items-center gap-2">
          <p className="text-sm text-foreground">
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
