import Link from "next/link";

type BrandProps = {
  href: string;
  locale?: string;
  footer?: boolean;
};

export function Brand({ href, locale = "fr", footer = false }: BrandProps) {
  return (
    <Link
      aria-label="Fast Print Sahline"
      className={footer ? "brand brand-footer" : "brand"}
      href={href}
    >
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-letters">FPS</span>
        <span className="brand-petals">
          <i />
          <i />
          <i />
          <i />
        </span>
      </span>
      <span className="brand-name">
        {locale === "ar" ? "طباعة وإشهار" : locale === "en" ? "PRINT & PUBLICITY" : "IMPRESSION & PUBLICITÉ"}
        <small>SAHLINE · TUNISIE</small>
      </span>
    </Link>
  );
}
