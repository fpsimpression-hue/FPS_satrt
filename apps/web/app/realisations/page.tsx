"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale, type Locale } from "@/lib/api";
import { portfolioCategories } from "@/lib/portfolio";

type ProjectVideo = { id: string; title: Record<Locale, string>; src: string; contentType: "video/mp4" | "video/webm"; poster?: string };
type ClientTestimonial = { id: string; name: string; organization: string; quote: Record<Locale, string> };

const projectVideos: ProjectVideo[] = [];
const clientTestimonials: ClientTestimonial[] = [];

const copy = {
  fr: {
    eyebrow: "Fast Print · Sahline",
    title: "Des réalisations classées par catégorie",
    intro: "Parcourez les projets imprimés et personnalisés de l’atelier. Chaque catégorie et chaque photo est numérotée pour retrouver facilement les réalisations.",
    all: "Toutes les catégories",
    photos: "photos",
    viewPhoto: "Ouvrir la photo en taille réelle",
    browse: "Découvrir le catalogue",
    quote: "Demander un devis",
    videosTitle: "Nos réalisations en vidéo",
    videosIntro: "Retrouvez ici les vidéos des projets réalisés par l’atelier.",
    videosEmpty: "Les vidéos seront ajoutées ici dès qu’elles seront disponibles.",
    testimonialsTitle: "La parole à nos clients",
    testimonialsIntro: "Les retours de clients sont publiés avec leur accord.",
    testimonialsEmpty: "Les témoignages clients autorisés seront affichés ici.",
  },
  ar: {
    eyebrow: "Fast Print · الساحلين",
    title: "أعمالنا مرتبة حسب الفئة",
    intro: "اكتشفوا مشاريع الطباعة والتخصيص التي أنجزتها الورشة. الفئات والصور مرقمة لتسهيل تصفح الأعمال.",
    all: "كل الفئات",
    photos: "صور",
    viewPhoto: "فتح الصورة بالحجم الكامل",
    browse: "اكتشفوا المنتجات",
    quote: "اطلبوا عرض سعر",
    videosTitle: "أعمالنا بالفيديو",
    videosIntro: "شاهدوا هنا مقاطع للمشاريع التي أنجزتها الورشة.",
    videosEmpty: "ستُضاف مقاطع الفيديو هنا عند توفرها.",
    testimonialsTitle: "آراء عملائنا",
    testimonialsIntro: "ننشر آراء العملاء بعد الحصول على موافقتهم.",
    testimonialsEmpty: "ستُعرض هنا آراء العملاء المصرح بنشرها.",
  },
  en: {
    eyebrow: "Fast Print · Sahline",
    title: "Work, organized by category",
    intro: "Browse the studio’s printed and custom projects. Each category and photo is numbered so you can find work easily.",
    all: "All categories",
    photos: "photos",
    viewPhoto: "Open the full-size photo",
    browse: "Browse the catalogue",
    quote: "Request a quote",
    videosTitle: "Our work on video",
    videosIntro: "Videos of projects completed by the studio will appear here.",
    videosEmpty: "Videos will be added here when available.",
    testimonialsTitle: "What our clients say",
    testimonialsIntro: "Client feedback is shared with their permission.",
    testimonialsEmpty: "Approved client testimonials will appear here.",
  },
} satisfies Record<Locale, Record<string, string>>;

const allPhotosCount = portfolioCategories.reduce((total, category) => total + category.photos.length, 0);

export default function RealisationsPage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [activeCategory, setActiveCategory] = useState("all");
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
        <div className="portfolio-intro-actions">
          <Link className="button button-dark" href={`/catalogue?lang=${locale}`}>{text.browse}<span aria-hidden="true">↗</span></Link>
          <Link className="text-link" href={`/devis?lang=${locale}`}>{text.quote}<span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <nav className="portfolio-filters" aria-label={text.all}>
        <button aria-pressed={activeCategory === "all"} className={activeCategory === "all" ? "portfolio-filter active" : "portfolio-filter"} onClick={() => setActiveCategory("all")} type="button">
          <span>00</span>{text.all}<small>{allPhotosCount}</small>
        </button>
        {portfolioCategories.map((category) => (
          <button aria-pressed={activeCategory === category.id} className={activeCategory === category.id ? "portfolio-filter active" : "portfolio-filter"} key={category.id} onClick={() => setActiveCategory(category.id)} type="button">
            <span>{category.number}</span>{category.title[locale]}<small>{category.photos.length}</small>
          </button>
        ))}
      </nav>

      <div className="portfolio-groups">
        {visibleCategories.map((category) => (
          <section aria-labelledby={`portfolio-${category.id}`} className="portfolio-category" id={`portfolio-${category.id}`} key={category.id}>
            <div className="portfolio-category-heading">
              <span className="portfolio-category-number">{category.number}</span>
              <div><p className="eyebrow"><span />{category.photos.length} {text.photos}</p><h2 id={`portfolio-${category.id}`}>{category.title[locale]}</h2></div>
            </div>
            <div className="portfolio-grid">
              {category.photos.map((photo, index) => {
                const assetNumber = String(index + 1).padStart(2, "0");
                const imagePath = `/portfolio/${category.id}/${assetNumber}.jpg`;

                return (
                  <figure className={`portfolio-card portfolio-card-${(index % 7) + 1}`} key={photo.source}>
                    <a aria-label={`${text.viewPhoto}: ${photo.alt}`} className="portfolio-image-wrap" href={imagePath} rel="noreferrer" target="_blank">
                      <Image alt={photo.alt} className="portfolio-image" fill loading="lazy" sizes="(max-width: 600px) 92vw, (max-width: 1000px) 45vw, 30vw" src={imagePath} />
                      <span className="portfolio-open-icon" aria-hidden="true">↗</span>
                    </a>
                    <figcaption>{photo.alt}</figcaption>
                  </figure>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="showcase-section section-wrap">
        <div className="showcase-heading">
          <div><p className="eyebrow"><span />FAST PRINT · SAHLINE</p><h2>{text.videosTitle}</h2></div>
          <p>{text.videosIntro}</p>
        </div>
        {projectVideos.length > 0 ? (
          <div className="showcase-video-grid">
            {projectVideos.map((video) => (
              <article className="showcase-video-card" key={video.id}>
                <video controls playsInline preload="metadata" poster={video.poster}><source src={video.src} type={video.contentType} /></video>
                <h3>{video.title[locale]}</h3>
              </article>
            ))}
          </div>
        ) : <p className="showcase-empty">{text.videosEmpty}</p>}
      </section>

      <section className="testimonials-section section-wrap">
        <div className="showcase-heading">
          <div><p className="eyebrow"><span />FAST PRINT · SAHLINE</p><h2>{text.testimonialsTitle}</h2></div>
          <p>{text.testimonialsIntro}</p>
        </div>
        {clientTestimonials.length > 0 ? (
          <div className="testimonials-grid">
            {clientTestimonials.map((testimonial) => (
              <figure className="testimonial-card" key={testimonial.id}>
                <blockquote>“{testimonial.quote[locale]}”</blockquote>
                <figcaption><strong>{testimonial.name}</strong><span>{testimonial.organization}</span></figcaption>
              </figure>
            ))}
          </div>
        ) : <p className="showcase-empty">{text.testimonialsEmpty}</p>}
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
