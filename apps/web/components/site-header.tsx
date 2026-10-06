import { Brand } from "@/components/brand";

type Locale = "fr" | "ar" | "en";

const labels: Record<Locale, { navigation: string; services: string; catalogue: string; pricing: string; contact: string; quote: string; language: string; choices: Record<Locale, string> }> = {
  fr: { navigation: "Navigation principale", services: "Services", catalogue: "Catalogue", pricing: "Tarifs", contact: "Contact", quote: "Devis", language: "Langue", choices: { fr: "FR", ar: "عربي", en: "EN" } },
  ar: { navigation: "التنقل الرئيسي", services: "خدماتنا", catalogue: "المنتجات", pricing: "الأسعار", contact: "اتصال", quote: "طلب عرض سعر", language: "اللغة", choices: { fr: "FR", ar: "عربي", en: "EN" } },
  en: { navigation: "Main navigation", services: "Services", catalogue: "Catalogue", pricing: "Pricing", contact: "Contact", quote: "Get a quote", language: "Language", choices: { fr: "FR", ar: "عربي", en: "EN" } },
};

export function SiteHeader({ locale, onLocaleChange }: { locale: Locale; onLocaleChange: (locale: Locale) => void }) {
  const text = labels[locale];

  return (
    <header className="site-header">
      <Brand href={`/?lang=${locale}`} locale={locale} />
      <nav className="header-right" aria-label={text.navigation}>
        <div className="header-links">
          <a className="header-link" href={`/services?lang=${locale}`}>{text.services}</a>
          <a className="header-link" href={`/catalogue?lang=${locale}`}>{text.catalogue}</a>
          <a className="header-link" href={`/?lang=${locale}#tarifs`}>{text.pricing}</a>
          <a className="header-link" href={`/?lang=${locale}#contact`}>{text.contact}</a>
          <a className="header-link quote-link" href={`/devis?lang=${locale}`}>{text.quote}</a>
        </div>
        <div className="language-picker" aria-label={text.language}>
          {(Object.keys(text.choices) as Locale[]).map((choice) => (
            <button
              aria-pressed={locale === choice}
              className={locale === choice ? "language active" : "language"}
              key={choice}
              onClick={() => onLocaleChange(choice)}
              type="button"
            >
              {text.choices[choice]}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
