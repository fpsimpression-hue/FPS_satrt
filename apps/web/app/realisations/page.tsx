"use client";

import Image from "next/image";
import Link from "next/link";
import { type TouchEvent, useCallback, useEffect, useRef, useState } from "react";

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

// In "show all" mode each speciality shows one large photo and four small ones.
const PREVIEW_COUNT = 5;

// Best photo of each speciality: used for the filter thumbnails and the hero mosaic.
const coverIndex: Record<string, number> = {
  enseignes: 7,
  vehicules: 1,
  "grand-format": 10,
  textile: 1,
  "objets-cadeaux": 3,
  "imprimes-papeterie": 3,
  "decoration-tableaux": 7,
  "plv-decoupe": 2,
};
const heroMosaic = ["enseignes", "vehicules", "decoration-tableaux", "textile"];

const copy = {
  fr: {
    eyebrow: "Réalisations · Fast Print Sahline",
    title: "Des projets réels, sortis de notre atelier.",
    intro: "Enseignes, véhicules, textile, cadeaux… Parcourez nos réalisations par savoir-faire, ouvrez une photo en grand et trouvez l’idée de votre prochain projet.",
    photos: "réalisations",
    skills: "savoir-faire",
    all: "Tout voir",
    filters: "Filtrer par savoir-faire",
    seeAll: "Voir tout",
    similar: "Un devis pour ce type de projet",
    quote: "Demander un devis",
    browse: "Voir le catalogue",
    open: "Agrandir la photo",
    close: "Fermer",
    previous: "Photo précédente",
    next: "Photo suivante",
    viewerQuote: "Un projet similaire ? Demander un devis",
    ctaTitle: "Votre projet sera le prochain.",
    ctaText: "Décrivez votre idée en 2 minutes : nous vous répondons avec un prix et un délai.",
    whatsapp: "Écrire sur WhatsApp",
    videosTitle: "Nos réalisations en vidéo",
    testimonialsTitle: "La parole à nos clients",
  },
  ar: {
    eyebrow: "أعمالنا · Fast Print Sahline",
    title: "مشاريع حقيقية خرجت من ورشتنا.",
    intro: "لافتات، سيارات، ملابس، هدايا… تصفحوا أعمالنا حسب المجال، افتحوا الصورة بحجم كبير وجدوا فكرة مشروعكم القادم.",
    photos: "عملاً",
    skills: "مجالات خبرة",
    all: "عرض الكل",
    filters: "التصفية حسب المجال",
    seeAll: "عرض الكل",
    similar: "عرض سعر لهذا النوع من المشاريع",
    quote: "اطلبوا عرض سعر",
    browse: "تصفحوا الكتالوج",
    open: "تكبير الصورة",
    close: "إغلاق",
    previous: "الصورة السابقة",
    next: "الصورة التالية",
    viewerQuote: "مشروع مشابه؟ اطلبوا عرض سعر",
    ctaTitle: "مشروعكم هو القادم.",
    ctaText: "صفوا فكرتكم في دقيقتين: نرد عليكم بالسعر والمدة.",
    whatsapp: "الكتابة عبر واتساب",
    videosTitle: "أعمالنا بالفيديو",
    testimonialsTitle: "آراء عملائنا",
  },
  en: {
    eyebrow: "Our work · Fast Print Sahline",
    title: "Real projects, straight from our workshop.",
    intro: "Signs, vehicles, apparel, gifts… Browse our work by speciality, open any photo full size and find the idea for your next project.",
    photos: "projects",
    skills: "specialities",
    all: "Show all",
    filters: "Filter by speciality",
    seeAll: "See all",
    similar: "Quote for this kind of project",
    quote: "Request a quote",
    browse: "Browse the catalogue",
    open: "Enlarge photo",
    close: "Close",
    previous: "Previous photo",
    next: "Next photo",
    viewerQuote: "Similar project? Request a quote",
    ctaTitle: "Your project could be next.",
    ctaText: "Describe your idea in 2 minutes: we reply with a price and a lead time.",
    whatsapp: "Message us on WhatsApp",
    videosTitle: "Our work on video",
    testimonialsTitle: "What our clients say",
  },
} as const;

const allPhotosCount = portfolioCategories.reduce((total, category) => total + category.photos.length, 0);

function photoPath(category: PortfolioCategory, index: number) {
  return `/portfolio/${category.id}/${String(index + 1).padStart(2, "0")}.jpg`;
}

function coverPath(category: PortfolioCategory) {
  return photoPath(category, Math.min(coverIndex[category.id] ?? 0, category.photos.length - 1));
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
  const filtersRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
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

  // Keep the active chip visible inside the horizontally scrolling filter bar.
  useEffect(() => {
    const bar = filtersRef.current;
    const chip = bar?.querySelector<HTMLElement>(".portfolio-filter.active");
    if (!bar || !chip) return;
    bar.scrollTo({ left: chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [activeCategory]);

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

  // Keep the current thumbnail in view inside the viewer strip.
  useEffect(() => {
    document.querySelector(".portfolio-viewer-strip [aria-current='true']")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [viewer]);

  // A swipe on a phone moves to the next or previous photo.
  function onTouchEnd(event: TouchEvent) {
    if (touchStart.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(delta) < 50) return;
    step((delta < 0 ? 1 : -1) * (locale === "ar" ? -1 : 1));
  }

  const visibleCategories = activeCategory === "all"
    ? portfolioCategories
    : portfolioCategories.filter((category) => category.id === activeCategory);

  return (
    <main className="shop-page realisations-page" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <SiteHeader locale={locale} onLocaleChange={changeLocale} />
      <section className="shop-intro portfolio-intro">
        <div className="portfolio-intro-copy">
          <p className="eyebrow"><span />{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
          <div className="portfolio-intro-actions">
            <Link className="button button-dark" href={`/devis?lang=${locale}`}>{text.quote}<span aria-hidden="true">↗</span></Link>
            <Link className="text-link" href={`/catalogue?lang=${locale}`}>{text.browse}<span aria-hidden="true">→</span></Link>
          </div>
          <dl className="portfolio-stats">
            <div><dt>{text.photos}</dt><dd>{allPhotosCount}</dd></div>
            <div><dt>{text.skills}</dt><dd>{portfolioCategories.length}</dd></div>
          </dl>
        </div>
        <div className="portfolio-mosaic">
          {heroMosaic.map((id) => {
            const category = portfolioCategories.find((item) => item.id === id);
            if (!category) return null;
            return (
              <button className="portfolio-mosaic-tile" key={id} onClick={() => selectCategory(id)} type="button">
                <Image alt="" fill priority sizes="(max-width: 900px) 45vw, 22vw" src={coverPath(category)} />
                <span>{category.title[locale]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <nav className="portfolio-filters" aria-label={text.filters} ref={filtersRef}>
        <button aria-pressed={activeCategory === "all"} className={activeCategory === "all" ? "portfolio-filter active" : "portfolio-filter"} onClick={() => selectCategory("all")} type="button">
          <span className="portfolio-filter-all" aria-hidden="true"><svg viewBox="0 0 14 14" fill="currentColor"><rect height="6" rx="1.5" width="6" /><rect height="6" rx="1.5" width="6" x="8" /><rect height="6" rx="1.5" width="6" y="8" /><rect height="6" rx="1.5" width="6" x="8" y="8" /></svg></span>{text.all}<small>{allPhotosCount}</small>
        </button>
        {portfolioCategories.map((category) => (
          <button aria-pressed={activeCategory === category.id} className={activeCategory === category.id ? "portfolio-filter active" : "portfolio-filter"} key={category.id} onClick={() => selectCategory(category.id)} type="button">
            <Image alt="" className="portfolio-filter-thumb" height={28} src={coverPath(category)} width={28} />
            {category.title[locale]}<small>{category.photos.length}</small>
          </button>
        ))}
      </nav>

      <div className="portfolio-groups" ref={groupsRef}>
        {visibleCategories.map((category) => {
          const showAll = activeCategory !== "all";
          const preview = showAll ? category.photos : category.photos.slice(0, PREVIEW_COUNT);
          const hidden = category.photos.length - preview.length;
          return (
            <section aria-labelledby={`portfolio-title-${category.id}`} className="portfolio-category" id={`portfolio-${category.id}`} key={`${activeCategory}-${category.id}`}>
              <div className="portfolio-category-heading">
                <div>
                  <span className="portfolio-category-number">{category.number}</span>
                  <h2 id={`portfolio-title-${category.id}`}>{category.title[locale]} <small>{category.photos.length}</small></h2>
                </div>
                <div className="portfolio-category-links">
                  {hidden > 0 && (
                    <button className="portfolio-see-all" onClick={() => selectCategory(category.id)} type="button">{text.seeAll}<span aria-hidden="true">→</span></button>
                  )}
                  <Link className="portfolio-quote-link" href={`/devis?lang=${locale}&projet=${category.id}`}>{text.similar}<span aria-hidden="true">↗</span></Link>
                </div>
              </div>
              <div className="portfolio-grid">
                {preview.map((photo, index) => {
                  const isMoreTile = hidden > 0 && index === preview.length - 1;
                  const isLarge = index % 9 === 0;
                  return (
                    <figure className={isLarge ? "portfolio-card is-large" : "portfolio-card"} key={photo.source} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
                      <button
                        aria-label={isMoreTile ? `${text.seeAll} : ${category.title[locale]}` : `${text.open} : ${photo.alt}`}
                        className="portfolio-image-wrap"
                        onClick={() => (isMoreTile ? selectCategory(category.id) : setViewer({ categoryId: category.id, index }))}
                        type="button"
                      >
                        <Image alt={photo.alt} className="portfolio-image" fill sizes={isLarge ? "(max-width: 700px) 92vw, 50vw" : "(max-width: 700px) 46vw, 25vw"} src={photoPath(category, index)} />
                        {isMoreTile
                          ? <span className="portfolio-more-tile"><strong>+{hidden}</strong>{text.seeAll}</span>
                          : <span className="portfolio-caption">{photo.alt}</span>}
                      </button>
                    </figure>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="portfolio-cta">
        <div>
          <h2>{text.ctaTitle}</h2>
          <p>{text.ctaText}</p>
        </div>
        <div className="portfolio-cta-actions">
          <Link className="button portfolio-cta-quote" href={`/devis?lang=${locale}${activeCategory !== "all" ? `&projet=${activeCategory}` : ""}`}>{text.quote}<span aria-hidden="true">↗</span></Link>
          <a className="portfolio-cta-whatsapp" href="https://wa.me/21623267178" rel="noreferrer" target="_blank">{text.whatsapp}</a>
        </div>
      </section>

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
        <div
          aria-label={viewerCategory.photos[viewer.index].alt}
          aria-modal="true"
          className="portfolio-viewer"
          onClick={(event) => { if (event.target === event.currentTarget) setViewer(null); }}
          onTouchEnd={onTouchEnd}
          onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
          role="dialog"
        >
          <button aria-label={text.close} className="portfolio-viewer-close" onClick={() => setViewer(null)} ref={closeRef} type="button">×</button>
          <button aria-label={text.previous} className="portfolio-viewer-nav is-previous" onClick={() => step(-1)} type="button">‹</button>
          <figure className="portfolio-viewer-figure">
            <div className="portfolio-viewer-image">
              <Image alt={viewerCategory.photos[viewer.index].alt} fill key={viewer.index} priority sizes="90vw" src={photoPath(viewerCategory, viewer.index)} />
            </div>
            <figcaption>
              <span>{viewerCategory.title[locale]} · {viewer.index + 1} / {viewerCategory.photos.length}</span>
              <strong>{viewerCategory.photos[viewer.index].alt}</strong>
              <Link className="button button-dark" href={`/devis?lang=${locale}&projet=${viewerCategory.id}`}>{text.viewerQuote}<span aria-hidden="true">↗</span></Link>
            </figcaption>
            <div className="portfolio-viewer-strip">
              {viewerCategory.photos.map((photo, index) => (
                <button aria-current={index === viewer.index} aria-label={photo.alt} key={photo.source} onClick={() => setViewer({ categoryId: viewerCategory.id, index })} type="button">
                  <Image alt="" height={56} src={photoPath(viewerCategory, index)} width={56} />
                </button>
              ))}
            </div>
          </figure>
          <button aria-label={text.next} className="portfolio-viewer-nav is-next" onClick={() => step(1)} type="button">›</button>
        </div>
      )}
      <SiteFooter locale={locale} />
    </main>
  );
}
