"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest, assetUrl, getLocale, localized, type Locale, type Product } from "@/lib/api";
import { localCatalogueProducts } from "@/lib/local-catalog";

const copy = {
  fr: {
    eyebrow: "Devis & commande · Fast Print Sahline",
    title: "Parlons de votre projet.",
    intro: "Choisissez un produit, remplissez son formulaire, puis envoyez votre demande à l’équipe Fast Print ou continuez la conversation sur WhatsApp.",
    loading: "Chargement des produits…",
    error: "Les produits sont momentanément indisponibles.",
    retry: "Réessayer",
    action: "Remplir le formulaire",
    quote: "Prix et devis confirmés après vérification de votre demande.",
  },
  ar: {
    eyebrow: "عرض سعر وطلب · فاست برينت الساحلين",
    title: "لنتحدث عن مشروعكم.",
    intro: "اختاروا المنتج واملؤوا الاستمارة، ثم أرسلوا طلبكم إلى فريق فاست برينت أو تابعوا المحادثة عبر واتساب.",
    loading: "جارٍ تحميل المنتجات…",
    error: "المنتجات غير متاحة حالياً.",
    retry: "إعادة المحاولة",
    action: "ملء الاستمارة",
    quote: "يؤكد الفريق السعر والعرض بعد مراجعة طلبكم.",
  },
  en: {
    eyebrow: "Quote & order · Fast Print Sahline",
    title: "Tell us about your project.",
    intro: "Choose a product and fill in its form, then send your request to the Fast Print team or continue the conversation on WhatsApp.",
    loading: "Loading products…",
    error: "Products are temporarily unavailable.",
    retry: "Try again",
    action: "Fill in the form",
    quote: "The team confirms pricing and quotes after reviewing your request.",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function QuotePage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const text = copy[locale];

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState(null, "", url);
  }

  useEffect(() => {
    setLocale(getLocale());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    apiRequest<Product[]>("/catalog/products")
      .then((result) => {
        if (!cancelled) setProducts(result);
      })
      .catch(() => {
        if (!cancelled) setProducts(localCatalogueProducts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return (
    <main className="shop-page quote-page" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <SiteHeader locale={locale} onLocaleChange={changeLocale} />
      <section className="shop-intro quote-intro">
        <p className="eyebrow"><span />{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
        <small>{text.quote}</small>
      </section>
      {loading && <p className="catalogue-message" role="status">{text.loading}</p>}
      {error && (
        <div className="catalogue-message catalogue-error" role="alert">
          <p>{text.error}</p>
          <button className="button button-dark" onClick={() => setRefresh((value) => value + 1)} type="button">{text.retry}</button>
        </div>
      )}
      {!loading && !error && (
        <section className="catalogue-grid quote-product-grid" aria-label={text.eyebrow}>
          {products.map((product, index) => {
            const image = product.images.find((item) => item.is_primary) ?? product.images[0];
            return (
              <article className={`catalogue-card catalogue-card-${(index % 6) + 1}`} key={product.id}>
                <div className="catalogue-card-top">
                  <span>{localized(product.category.translations, locale)}</span>
                  <span aria-hidden="true">0{index + 1}</span>
                </div>
                {image ? (
                  <Image
                    alt={image.alt_texts[locale] || localized(product.translations, locale)}
                    className="catalogue-product-image"
                    height={400}
                    loading="lazy"
                    src={assetUrl(image.url)}
                    unoptimized
                    width={640}
                  />
                ) : (
                  <div className="catalogue-image-placeholder quote-product-placeholder" aria-hidden="true">
                    <span>FAST PRINT</span><strong>{localized(product.category.translations, locale)}</strong>
                  </div>
                )}
                <div className="catalogue-card-bottom">
                  <h2>{localized(product.translations, locale)}</h2>
                  <p>{localized(product.descriptions, locale)}</p>
                  <div className="catalogue-card-action">
                    <span>{text.action}</span>
                    <Link aria-label={`${text.action} : ${localized(product.translations, locale)}`} href={`/products/${product.slug}?lang=${locale}`}>↗</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
      <SiteFooter locale={locale} />
    </main>
  );
}
