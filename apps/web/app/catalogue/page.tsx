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
  type Locale,
  type Product,
} from "@/lib/api";
import { localCatalogueProducts } from "@/lib/local-catalog";
import { portfolioCategories } from "@/lib/portfolio";
import { fallbackPhotos } from "@/lib/product-photos";

const copy = {
  fr: {
    eyebrow: "Catalogue Fast Print",
    title: "Choisissez votre idée.",
    intro: "Parcourez les produits, comparez leurs visuels et composez votre projet selon le format et les finitions souhaités.",
    portfolioEyebrow: "Nos réalisations",
    portfolioTitle: "Explorez par catégorie.",
    portfolioBody: "Des exemples concrets de nos impressions et créations, classés pour trouver l’inspiration.",
    viewCategory: "Voir les réalisations",
    photos: "photos",
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
    intro: "تصفّحوا المنتجات والصور واختاروا المقاس والتشطيبات المناسبة لمشروعكم.",
    portfolioEyebrow: "أعمالنا",
    portfolioTitle: "اكتشفوا حسب الفئة.",
    portfolioBody: "أمثلة حقيقية من مطبوعاتنا وتصاميمنا، مرتبة لتجدوا الإلهام بسهولة.",
    viewCategory: "عرض الأعمال",
    photos: "صور",
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
    intro: "Compare products and image sets, then shape your project with the right size and finish.",
    portfolioEyebrow: "Our work",
    portfolioTitle: "Explore by category.",
    portfolioBody: "Real examples of our printing and custom work, organised to help you find inspiration.",
    viewCategory: "View projects",
    photos: "photos",
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
  const [products, setProducts] = useState<Product[]>([]);
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

    apiRequest<Product[]>("/catalog/products")
      .then((productResult) => {
        if (cancelled) return;
        setProducts(productResult);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts(localCatalogueProducts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refresh, text.error]);

  return (
    <main className="shop-page" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <SiteHeader locale={locale} onLocaleChange={changeLocale} />
      <section className="shop-intro">
        <p className="eyebrow"><span />{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
      </section>
      <section className="catalogue-categories section-wrap" aria-labelledby="catalogue-categories-title">
        <div className="palette-heading">
          <div>
            <p className="eyebrow"><span />{text.portfolioEyebrow}</p>
            <h2 id="catalogue-categories-title">{text.portfolioTitle}</h2>
          </div>
          <p>{text.portfolioBody}</p>
        </div>
        <div className="catalogue-category-grid">
          {portfolioCategories.map((category) => (
            <Link
              aria-label={`${text.viewCategory} : ${category.title[locale]}`}
              className="catalogue-category-card"
              href={`/realisations?lang=${locale}#portfolio-${category.id}`}
              key={category.id}
            >
              <div className="catalogue-category-image">
                <Image
                  alt={category.photos[0]?.alt ?? category.title[locale]}
                  fill
                  loading="lazy"
                  sizes="(max-width: 600px) 88vw, (max-width: 850px) 44vw, 22vw"
                  src={`/portfolio/${category.id}/01.jpg`}
                />
                <span className="catalogue-category-number">{category.number}</span>
                <span aria-hidden="true" className="catalogue-category-arrow">↗</span>
              </div>
              <div className="catalogue-category-copy">
                <h3>{category.title[locale]}</h3>
                <span>{category.photos.length} {text.photos}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      {loading && <p className="catalogue-message" role="status">{text.loading}</p>}
      {error && (
        <div className="catalogue-message catalogue-error" role="alert">
          <p>{error}</p><button className="button button-dark" onClick={() => setRefresh((value) => value + 1)} type="button">{text.retry}</button>
        </div>
      )}
      {!loading && !error && (
        <section className="catalogue-grid" aria-label={text.title}>
          {products.map((product, index) => {
            const images = [...product.images]
              .sort((left, right) => Number(right.is_primary) - Number(left.is_primary) || left.sort_order - right.sort_order)
              .slice(0, 3);
            const fallback = images.length ? [] : (fallbackPhotos[product.slug] ?? []);
            const photoCount = images.length || fallback.length;
            return (
              <article className={`catalogue-card catalogue-card-${(index % 6) + 1}${index === 0 ? " catalogue-card-featured" : ""}`} key={product.id}>
                <div className="catalogue-card-top">
                  <span>{localized(product.category.translations, locale)}</span>
                </div>
                <div className={`catalogue-image-set image-count-${photoCount}`}>
                  {fallback.map((photo, imageIndex) => (
                    <Image
                      alt=""
                      className={`catalogue-set-image catalogue-set-image-${imageIndex + 1}`}
                      height={440}
                      key={photo}
                      loading="lazy"
                      src={`/portfolio/${photo}`}
                      width={680}
                    />
                  ))}
                  {images.length > 0 ? images.map((image, imageIndex) => (
                    <Image
                      alt={image.alt_texts[locale] || localized(product.translations, locale)}
                      className={`catalogue-set-image catalogue-set-image-${imageIndex + 1}`}
                      height={440}
                      key={image.id}
                      loading="lazy"
                      src={assetUrl(image.url)}
                      unoptimized
                      width={680}
                    />
                  )) : fallback.length === 0 && (
                    <div className="catalogue-image-placeholder" aria-hidden="true">
                      <span>FAST PRINT</span><strong>{localized(product.category.translations, locale)}</strong>
                    </div>
                  )}
                  {product.images.length > 3 && <span className="catalogue-image-count">+{product.images.length - 3}</span>}
                </div>
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
