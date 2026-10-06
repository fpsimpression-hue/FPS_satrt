"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  apiRequest,
  assetUrl,
  getLocale,
  localized,
  type Category,
  type Locale,
  type Product,
} from "@/lib/api";

const copy = {
  fr: {
    eyebrow: "Catalogue Fast Print",
    title: "Choisissez votre idée.",
    intro: "Parcourez les produits personnalisables. Chaque option est détaillée avant votre demande.",
    all: "Tout voir",
    requestQuote: "Prix selon les options",
    details: "Voir le produit",
    loading: "Chargement du catalogue…",
    error: "Le catalogue est momentanément indisponible.",
    retry: "Réessayer",
    language: "Langue",
  },
  ar: {
    eyebrow: "كتالوج فاست برينت",
    title: "اختاروا فكرتكم.",
    intro: "تصفّحوا المنتجات المخصّصة. كل الخيارات موضّحة قبل تقديم الطلب.",
    all: "عرض الكل",
    requestQuote: "السعر حسب الخيارات",
    details: "عرض المنتج",
    loading: "جارٍ تحميل الكتالوج…",
    error: "الكتالوج غير متاح حالياً.",
    retry: "إعادة المحاولة",
    language: "اللغة",
  },
  en: {
    eyebrow: "Fast Print catalogue",
    title: "Start with an idea.",
    intro: "Explore customisable products. Options are shown before you request a quote or order.",
    all: "View all",
    requestQuote: "Price depends on options",
    details: "View product",
    loading: "Loading the catalogue…",
    error: "The catalogue is temporarily unavailable.",
    retry: "Try again",
    language: "Language",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function CataloguePage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    setError("");

    Promise.all([
      apiRequest<Category[]>("/catalog/categories"),
      apiRequest<Product[]>("/catalog/products"),
    ])
      .then(([categoryResult, productResult]) => {
        if (cancelled) return;
        setCategories(categoryResult);
        setProducts(productResult);
      })
      .catch(() => {
        if (!cancelled) setError(text.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refresh, text.error]);

  const visibleProducts = categoryFilter
    ? products.filter((product) => product.category.slug === categoryFilter)
    : products;

  return (
    <main className="shop-page" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <SiteHeader locale={locale} onLocaleChange={changeLocale} />
      <section className="shop-intro">
        <p className="eyebrow"><span />{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
      </section>
      <nav className="catalogue-filters" aria-label={text.eyebrow}>
        <button className={!categoryFilter ? "filter-chip active" : "filter-chip"} onClick={() => setCategoryFilter("")} type="button">
          {text.all}
        </button>
        {categories.map((category) => (
          <button
            className={categoryFilter === category.slug ? "filter-chip active" : "filter-chip"}
            key={category.id}
            onClick={() => setCategoryFilter(category.slug)}
            type="button"
          >
            {localized(category.translations, locale)}
          </button>
        ))}
      </nav>
      {loading && <p className="catalogue-message" role="status">{text.loading}</p>}
      {error && (
        <div className="catalogue-message catalogue-error" role="alert">
          <p>{error}</p><button className="button button-dark" onClick={() => setRefresh((value) => value + 1)} type="button">{text.retry}</button>
        </div>
      )}
      {!loading && !error && (
        <section className="catalogue-grid" aria-label={text.title}>
          {visibleProducts.map((product, index) => {
            const image = product.images.find((item) => item.is_primary) ?? product.images[0];
            return (
              <article className={`catalogue-card catalogue-card-${(index % 6) + 1}`} key={product.id}>
                <div className="catalogue-card-top">
                  <span>{localized(product.category.translations, locale)}</span>
                  <span aria-hidden="true">0{index + 1}</span>
                </div>
                {image && (
                  <Image
                    alt={image.alt_texts[locale] || localized(product.translations, locale)}
                    className="catalogue-product-image"
                    height={360}
                    loading="lazy"
                    src={assetUrl(image.url)}
                    unoptimized
                    width={640}
                  />
                )}
                <div className="catalogue-card-bottom">
                  <h2>{localized(product.translations, locale)}</h2>
                  <p>{localized(product.descriptions, locale)}</p>
                  <div className="catalogue-card-action">
                    <span>{text.requestQuote}</span>
                    <Link aria-label={`${text.details} : ${localized(product.translations, locale)}`} href={`/products/${product.slug}?lang=${locale}`}>↗</Link>
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
