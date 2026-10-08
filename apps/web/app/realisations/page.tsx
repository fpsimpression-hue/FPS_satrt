"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale, type Locale } from "@/lib/api";
import { portfolioCategories, type PortfolioCategory } from "@/lib/portfolio";

type ProjectVideo = { id: string; title: Record<Locale, string>; src: string; contentType: "video/mp4" | "video/webm"; poster?: string };
type ClientTestimonial = { id: string; name: string; organization: string; quote: Record<Locale, string> };
type Viewer = { categoryId: string; index: number };

// Sections below appear automatically once real videos or approved testimonials are added.
const projectVideos: ProjectVideo[] = [];
const clientTestimonials: ClientTestimonial[] = [];

const PREVIEW_COUNT = 6;

const copy = {
  fr: {
    eyebrow: "Réalisations · Fast Print Sahline",
    title: "Nos réalisations",
    intro: "Des projets réels, sortis de notre atelier à Sahline. Choisissez une catégorie, ouvrez une photo en grand et inspirez-vous pour votre propre projet.",
    stats: (photos: number, categories: number) => `${photos} réalisations · ${categories} savoir-faire`,
    all: "Tout voir",
    filters: "Filtrer par savoir-faire",
    seeAll: (count: number) => `Voir les ${count} réalisations`,
    similar: "Demander un devis pour ce type de projet",
    quote: "Demander un devis",
    browse: "Voir le catalogue",
    open: "Agrandir la photo",
    close: "Fermer",
    previous: "Photo précédente",
    next: "Photo suivante",
    viewerQuote: "Un projet similaire ? Demander un devis",
    videosTitle: "Nos réalisations en vidéo",
    testimonialsTitle: "La parole à nos clients",
  },
  ar: {
    eyebrow: "أعمالنا · Fast Print Sahline",
    title: "أعمالنا",
    intro: "مشاريع حقيقية أنجزتها ورشتنا في الساحلين. اختاروا فئة وافتحوا الصورة بحجم كبير واستلهموا لمشروعكم.",
    stats: (photos: number, categories: number) => `${photos} عملاً · ${categories} مجالات خبرة`,
    all: "عرض الكل",
    filters: "التصفية حسب المجال",
    seeAll: (count: number) => `عرض ${count} عملاً`,
    similar: "اطلبوا عرض سعر لهذا النوع من المشاريع",
    quote: "اطلبوا عرض سعر",
    browse: "تصفحوا الكتالوج",
    open: "تكبير الصورة",
    close: "إغلاق",
    previous: "الصورة السابقة",
    next: "الصورة التالية",
    viewerQuote: "مشروع مشابه؟ اطلبوا عرض سعر",
    videosTitle: "أعمالنا بالفيديو",
    testimonialsTitle: "آراء عملائنا",
  },
  en: {
    eyebrow: "Our work · Fast Print Sahline",
    title: "Our work",
    intro: "Real projects from our workshop in Sahline. Pick a category, open a photo full size and get ideas for your own project.",
    stats: (photos: number, categories: number) => `${photos} projects · ${categories} specialities`,
    all: "Show all",
    filters: "Filter by speciality",
    seeAll: (count: number) => `See all ${count} projects`,
    similar: "Request a quote for this kind of project",
    quote: "Request a quote",
    browse: "Browse the catalogue",
    open: "Enlarge photo",
    close: "Close",
    previous: "Previous photo",
    next: "Next photo",
    viewerQuote: "Similar project? Request a quote",
    videosTitle: "Our work on video",
    testimonialsTitle: "What our clients say",
  },
} as const;

const allPhotosCount = portfolioCategories.reduce((total, category) => total + category.photos.length, 0);

function photoPath(category: PortfolioCategory, index: number) {
  return `/portfolio/${category.id}/${String(index + 1).padStart(2, "0")}.jpg`;
}

function categoryFromHash(): string {
  const id = window.location.hash.replace(/^#portfolio-/, "");
  return portfolioCategories.some((category) => category.id === id) ? id : "all";
}

export default function RealisationsPage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const groupsRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const text = copy[locale];

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState(null, "", url);
  }

  // Links from other pages (#portfolio-enseignes) open directly on that category.
  useEffect(() => {
    setLocale(getLocale());
    setActiveCategory(categoryFromHash());
    const onHashChange = () => setActiveCategory(categoryFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function selectCategory(id: string) {
    setActiveCategory(id);
    const url = new URL(window.location.href);
    url.hash = id === "all" ? "" : `portfolio-${id}`;
    window.history.replaceState(null, "", url);
    groupsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const viewerCategory = viewer ? portfolioCategories.find((category) => category.id === viewer.categoryId) : undefined;

  const step = useCallback((delta: number) => {
    setViewer((current) => {
      if (!current) return current;
      const category = portfolioCategories.find((item) => item.id === current.categoryId);
      if (!category) return current;
      const count = category.photos.length;
      return { ...current, index: (current.index + delta + count) % count };
    });
  }, []);

  useEffect(() => {
    if (!viewer) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewer(null);
      if (event.key === "ArrowRight") step(locale === "ar" ? -1 : 1);
      if (event.key === "ArrowLeft") step(locale === "ar" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [viewer, step, locale]);

  const visibleCategories = activeCategory === "all"
    ? portfolioCategories
    : portfolioCategories.filter((category) => category.id === activeCategory);

  return (
    <main className="shop-page realisations-page" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <SiteHeader locale={locale} onLocaleChange={changeLocale} />
      <section className="shop-intro portfolio-intro">
        <p className="eyebrow"><span />{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
        <p className="portfolio-stats">{text.stats(allPhotosCount, portfolioCategories.length)}</p>
        <div className="portfolio-intro-actions">
          <Link className="button button-dark" href={`/devis?lang=${locale}`}>{text.quote}<span aria-hidden="true">↗</span></Link>
          <Link className="text-link" href={`/catalogue?lang=${locale}`}>{text.browse}<span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <nav className="portfolio-filters" aria-label={text.filters}>
        <button aria-pressed={activeCategory === "all"} className={activeCategory === "all" ? "portfolio-filter active" : "portfolio-filter"} onClick={() => selectCategory("all")} type="button">
          {text.all}<small>{allPhotosCount}</small>
        </button>
        {portfolioCategories.map((category) => (
          <button aria-pressed={activeCategory === category.id} className={activeCategory === category.id ? "portfolio-filter active" : "portfolio-filter"} key={category.id} onClick={() => selectCategory(category.id)} type="button">
            {category.title[locale]}<small>{category.photos.length}</small>
          </button>
        ))}
      </nav>

      <div className="portfolio-groups" ref={groupsRef}>
        {visibleCategories.map((category) => {
          const preview = activeCategory === "all" ? category.photos.slice(0, PREVIEW_COUNT) : category.photos;
          return (
            <section aria-labelledby={`portfolio-title-${category.id}`} className="portfolio-category" id={`portfolio-${category.id}`} key={category.id}>
              <div className="portfolio-category-heading">
                <div>
                  <h2 id={`portfolio-title-${category.id}`}>{category.title[locale]}</h2>
                  <p>{category.photos.length} · <Link href={`/devis?lang=${locale}&projet=${category.id}`}>{text.similar}<span aria-hidden="true"> →</span></Link></p>
                </div>
              </div>
              <div className="portfolio-grid">
                {preview.map((photo, index) => (
                  <figure className={`portfolio-card portfolio-card-${(index % 7) + 1}`} key={photo.source}>
                    <button aria-label={`${text.open} : ${photo.alt}`} className="portfolio-image-wrap" onClick={() => setViewer({ categoryId: category.id, index })} type="button">
                      <Image alt={photo.alt} className="portfolio-image" fill loading="lazy" sizes="(max-width: 600px) 92vw, (max-width: 1000px) 45vw, 30vw" src={photoPath(category, index)} />
                      <span className="portfolio-open-icon" aria-hidden="true">⤢</span>
                    </button>
                    <figcaption>{photo.alt}</figcaption>
                  </figure>
                ))}
              </div>
              {preview.length < category.photos.length && (
                <button className="button button-outline portfolio-more" onClick={() => selectCategory(category.id)} type="button">
                  {text.seeAll(category.photos.length)}<span aria-hidden="true">→</span>
                </button>
              )}
            </section>
          );
        })}
      </div>

      {projectVideos.length > 0 && (
        <section className="showcase-section section-wrap">
          <div className="showcase-heading"><h2>{text.videosTitle}</h2></div>
          <div className="showcase-video-grid">
            {projectVideos.map((video) => (
              <article className="showcase-video-card" key={video.id}>
                <video controls playsInline preload="metadata" poster={video.poster}><source src={video.src} type={video.contentType} /></video>
                <h3>{video.title[locale]}</h3>
              </article>
            ))}
          </div>
        </section>
      )}

      {clientTestimonials.length > 0 && (
        <section className="testimonials-section section-wrap">
          <div className="showcase-heading"><h2>{text.testimonialsTitle}</h2></div>
          <div className="testimonials-grid">
            {clientTestimonials.map((testimonial) => (
              <figure className="testimonial-card" key={testimonial.id}>
                <blockquote>“{testimonial.quote[locale]}”</blockquote>
                <figcaption><strong>{testimonial.name}</strong><span>{testimonial.organization}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {viewer && viewerCategory && (
        <div aria-label={viewerCategory.photos[viewer.index].alt} aria-modal="true" className="portfolio-viewer" onClick={(event) => { if (event.target === event.currentTarget) setViewer(null); }} role="dialog">
          <button aria-label={text.close} className="portfolio-viewer-close" onClick={() => setViewer(null)} ref={closeRef} type="button">×</button>
          <button aria-label={text.previous} className="portfolio-viewer-nav is-previous" onClick={() => step(-1)} type="button">‹</button>
          <figure className="portfolio-viewer-figure">
            <div className="portfolio-viewer-image">
              <Image alt={viewerCategory.photos[viewer.index].alt} fill priority sizes="90vw" src={photoPath(viewerCategory, viewer.index)} />
            </div>
            <figcaption>
              <span>{viewerCategory.title[locale]} · {viewer.index + 1} / {viewerCategory.photos.length}</span>
              <strong>{viewerCategory.photos[viewer.index].alt}</strong>
              <Link className="button button-dark" href={`/devis?lang=${locale}&projet=${viewerCategory.id}`}>{text.viewerQuote}<span aria-hidden="true">↗</span></Link>
            </figcaption>
          </figure>
          <button aria-label={text.next} className="portfolio-viewer-nav is-next" onClick={() => step(1)} type="button">›</button>
        </div>
      )}
      <SiteFooter locale={locale} />
    </main>
  );
}
