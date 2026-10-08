"use client";

import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale, type Locale } from "@/lib/api";
import { faqAnchor, faqContent } from "@/lib/faq";

export default function FaqPage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const text = faqContent[locale];

  useEffect(() => setLocale(getLocale()), []);

  // A search result links to /faq#faq-N: open that answer and bring it into view.
  useEffect(() => {
    const target = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null;
    if (target instanceof HTMLDetailsElement) {
      target.open = true;
      target.scrollIntoView({ block: "center" });
    }
  }, []);

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState(null, "", url);
  }

  return (
    <main className="shop-page" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <SiteHeader locale={locale} onLocaleChange={changeLocale} />
      <section className="faq-page section-wrap">
        <div className="faq-page-heading">
          <p className="eyebrow"><span />{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
        </div>
        <div className="faq-list">
          {text.questions.map(([question, answer], index) => (
            <details className="faq-item" id={faqAnchor(index)} key={question}>
              <summary>{question}<span aria-hidden="true">+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
