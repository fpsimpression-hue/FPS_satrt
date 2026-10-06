import { Brand } from "@/components/brand";

type Locale = "fr" | "ar" | "en";

const labels: Record<Locale, { services: string; faq: string; contact: string; quote: string; language: string; choices: Record<Locale, string> }> = {
  fr: { services: "Découvrir nos services", faq: "FAQ", contact: "Contact", quote: "Devis", language: "Langue", choices: { fr: "FR", ar: "عربي", en: "EN" } },
  ar: { services: "اكتشفوا خدماتنا", faq: "الأسئلة الشائعة", contact: "اتصلوا بنا", quote: "طلب عرض سعر", language: "اللغة", choices: { fr: "FR", ar: "عربي", en: "EN" } },
  en: { services: "Explore our services", faq: "FAQ", contact: "Contact", quote: "Get a quote", language: "Language", choices: { fr: "FR", ar: "عربي", en: "EN" } },
};

export function SiteHeader({ locale, onLocaleChange }: { locale: Locale; onLocaleChange: (locale: Locale) => void }) {
  const text = labels[locale];

  return (
    <header className="site-header">
      <Brand href={`/?lang=${locale}`} locale={locale} />
      <nav className="header-right" aria-label={text.services}>
        <a className="header-link" href={`/catalogue?lang=${locale}`}>{text.services}</a>
        <a className="header-link" href={`/faq?lang=${locale}`}>{text.faq}</a>
        <a className="header-link" href={`/?lang=${locale}#contact`}>{text.contact}</a>
        <a className="header-link quote-link" href={`/catalogue?lang=${locale}`}>{text.quote}</a>
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
