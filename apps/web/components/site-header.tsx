"use client";

import { useEffect, useState } from "react";

import { Brand } from "@/components/brand";
import { SiteSearch } from "@/components/site-search";

type Locale = "fr" | "ar" | "en";

const labels: Record<Locale, { navigation: string; services: string; catalogue: string; gallery: string; about: string; contact: string; quote: string; quoteShort: string; language: string; openMenu: string; closeMenu: string; choices: Record<Locale, string> }> = {
  fr: { navigation: "Navigation principale", services: "Services", catalogue: "Catalogue", gallery: "Réalisations", about: "À propos", contact: "Contact", quote: "Demander un devis", quoteShort: "Devis", language: "Langue", openMenu: "Ouvrir le menu", closeMenu: "Fermer le menu", choices: { fr: "FR", ar: "عربي", en: "EN" } },
  ar: { navigation: "التنقل الرئيسي", services: "خدماتنا", catalogue: "المنتجات", gallery: "أعمالنا", about: "من نحن", contact: "اتصال", quote: "اطلبوا عرض سعر", quoteShort: "عرض سعر", language: "اللغة", openMenu: "فتح القائمة", closeMenu: "إغلاق القائمة", choices: { fr: "FR", ar: "عربي", en: "EN" } },
  en: { navigation: "Main navigation", services: "Services", catalogue: "Catalogue", gallery: "Our work", about: "About us", contact: "Contact", quote: "Get a quote", quoteShort: "Quote", language: "Language", openMenu: "Open menu", closeMenu: "Close menu", choices: { fr: "FR", ar: "عربي", en: "EN" } },
};

export function SiteHeader({ locale, onLocaleChange }: { locale: Locale; onLocaleChange: (locale: Locale) => void }) {
  const text = labels[locale];
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className={menuOpen ? "site-header menu-open" : "site-header"}>
      <Brand href={`/?lang=${locale}`} locale={locale} />
      <a className="header-quote-compact" href={`/devis?lang=${locale}`}>{text.quoteShort}</a>
      <button
        aria-controls="site-navigation"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? text.closeMenu : text.openMenu}
        className="menu-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        <span aria-hidden="true" />
      </button>
      <nav className="header-right" id="site-navigation" aria-label={text.navigation}>
        <div className="header-links">
          <a className="header-link" href={`/services?lang=${locale}`} onClick={closeMenu}>{text.services}</a>
          <a className="header-link" href={`/catalogue?lang=${locale}`} onClick={closeMenu}>{text.catalogue}</a>
          <a className="header-link" href={`/realisations?lang=${locale}`} onClick={closeMenu}>{text.gallery}</a>
          <a className="header-link" href={`/a-propos?lang=${locale}`} onClick={closeMenu}>{text.about}</a>
          <a className="header-link" href={`/?lang=${locale}#contact`} onClick={closeMenu}>{text.contact}</a>
          <a className="quote-link" href={`/devis?lang=${locale}`} onClick={closeMenu}>{text.quote}<span aria-hidden="true">↗</span></a>
        </div>
        <div className="language-picker" role="group" aria-label={text.language}>
          {(Object.keys(text.choices) as Locale[]).map((choice) => (
            <button
              aria-pressed={locale === choice}
              className={locale === choice ? "language active" : "language"}
              key={choice}
              lang={choice}
              onClick={() => {
                onLocaleChange(choice);
                closeMenu();
              }}
              type="button"
            >
              {text.choices[choice]}
            </button>
          ))}
        </div>
      </nav>
      <SiteSearch locale={locale} />
    </header>
  );
}
