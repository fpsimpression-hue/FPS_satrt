"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PartnerLogo, partners } from "@/components/partner-logo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest, getLocale, localized, type Locale, type Product } from "@/lib/api";
import { localCatalogueProducts } from "@/lib/local-catalog";
import { portfolioCategories } from "@/lib/portfolio";

const totalRealisations = portfolioCategories.reduce((total, category) => total + category.photos.length, 0);
const sortedCategories = [...portfolioCategories].sort((left, right) => right.photos.length - left.photos.length);
const largestCategory = sortedCategories[0]?.photos.length ?? 1;

// How the workshop is organised: three poles, each grouping its specialities.
const poles: { id: string; categories: string[] }[] = [
  { id: "print", categories: ["imprimes-papeterie", "textile", "grand-format"] },
  { id: "signs", categories: ["enseignes", "vehicules", "plv-decoupe"] },
  { id: "decor", categories: ["decoration-tableaux", "objets-cadeaux"] },
];

const copy = {
  fr: {
    eyebrow: "À propos · Fast Print Sahline",
    title: "L’atelier qui donne forme à vos idées.",
    intro: "À Sahline, près de Monastir, une seule équipe réunit conception graphique, impression numérique et fabrication sur mesure, de l’idée jusqu’à la remise de votre commande.",
    quote: "Demander un devis",
    gallery: "Voir nos réalisations",
    figures: { partners: "partenaires", realisations: "réalisations", skills: "savoir-faire", products: "produits en ligne" },
    guideTitle: "Ce qui nous guide",
    guide: [
      ["Mission", "Rendre l’impression professionnelle simple et accessible : conseil clair, fichiers vérifiés, travail soigné."],
      ["Vision", "Devenir l’atelier de référence du Sahel en communication visuelle, entre savoir-faire et outils numériques."],
      ["Objectifs", "Répondre vite, livrer des supports fidèles à votre image et vous suivre du devis à la remise."],
    ],
    treeTitle: "Comment l’atelier est organisé",
    treeIntro: "Trois pôles, huit savoir-faire, une même équipe.",
    poles: { print: "Impression", signs: "Signalétique & fabrication", decor: "Décoration & cadeaux" },
    base: "Socle commun : conception graphique · contrôle des fichiers · suivi WhatsApp",
    chartTitle: "Nos réalisations par savoir-faire",
    chartIntro: (total: number) => `${total} réalisations photographiées, du plus fréquent au plus rare.`,
    share: "du total",
    productsTitle: "Nos produits en ligne",
    productsHint: "Tout le reste se fait sur mesure via le devis en ligne.",
    partnersTitle: "Ils nous font confiance",
  },
  ar: {
    eyebrow: "من نحن · Fast Print Sahline",
    title: "الورشة التي تحوّل أفكاركم إلى واقع.",
    intro: "في الساحلين قرب المنستير، يجمع فريق واحد بين التصميم الجرافيكي والطباعة الرقمية والتصنيع حسب الطلب، من الفكرة حتى استلام طلبكم.",
    quote: "اطلبوا عرض سعر",
    gallery: "شاهدوا أعمالنا",
    figures: { partners: "شريكاً", realisations: "عملاً منجزاً", skills: "مجالات خبرة", products: "منتجات عبر الإنترنت" },
    guideTitle: "ما يوجّه عملنا",
    guide: [
      ["المهمة", "جعل الطباعة الاحترافية بسيطة ومتاحة: نصيحة واضحة وملفات مراجَعة وعمل متقن."],
      ["الرؤية", "أن نكون الورشة المرجعية في الساحل للاتصال المرئي، بين الحرفية والأدوات الرقمية."],
      ["الأهداف", "الرد بسرعة، وتسليم مطبوعات وفية لهويتكم، ومرافقتكم من عرض السعر إلى الاستلام."],
    ],
    treeTitle: "كيف تنتظم الورشة",
    treeIntro: "ثلاثة أقطاب، ثمانية مجالات، فريق واحد.",
    poles: { print: "الطباعة", signs: "اللافتات والتصنيع", decor: "الديكور والهدايا" },
    base: "قاعدة مشتركة: التصميم الجرافيكي · مراجعة الملفات · متابعة واتساب",
    chartTitle: "أعمالنا حسب المجال",
    chartIntro: (total: number) => `${total} عملاً مصوّراً، من الأكثر إلى الأقل.`,
    share: "من المجموع",
    productsTitle: "منتجاتنا عبر الإنترنت",
    productsHint: "وكل ما عدا ذلك حسب الطلب عبر عرض السعر.",
    partnersTitle: "يثقون بنا",
  },
  en: {
    eyebrow: "About · Fast Print Sahline",
    title: "The workshop that gives shape to your ideas.",
    intro: "In Sahline, near Monastir, one team brings graphic design, digital printing and custom production together, from first idea to collecting your order.",
    quote: "Request a quote",
    gallery: "See our work",
    figures: { partners: "partners", realisations: "projects", skills: "specialities", products: "products online" },
    guideTitle: "What guides us",
    guide: [
      ["Mission", "Make professional printing simple and accessible: clear advice, checked files, careful work."],
      ["Vision", "Become the Sahel’s reference workshop for visual communication, blending craft and digital tools."],
      ["Goals", "Answer fast, deliver work true to your brand and follow you from quote to handover."],
    ],
    treeTitle: "How the workshop is organised",
    treeIntro: "Three poles, eight specialities, one team.",
    poles: { print: "Printing", signs: "Signs & production", decor: "Decor & gifts" },
    base: "Shared foundation: graphic design · file checks · WhatsApp follow-up",
    chartTitle: "Our work by speciality",
    chartIntro: (total: number) => `${total} photographed projects, most to least frequent.`,
    share: "of total",
    productsTitle: "Our products online",
    productsHint: "Everything else is made to order through the online quote.",
    partnersTitle: "Trusted by",
  },
} as const;

/** Counts up from 0 once the element scrolls into view (instant when motion is reduced). */
function CountUp({ value, active }: { value: number; active: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1100);
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, value]);
  return <>{shown}</>;
}

/** True once the referenced element has entered the viewport. */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, inView] as const;
}

export default function AboutPage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [products, setProducts] = useState<Product[]>(localCatalogueProducts);
  const [figuresRef, figuresInView] = useInView<HTMLDListElement>();
  const [chartRef, chartInView] = useInView<HTMLOListElement>();
  const text = copy[locale];

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState(null, "", url);
  }

  useEffect(() => {
    setLocale(getLocale());
    let cancelled = false;
    apiRequest<Product[]>("/catalog/products")
      .then((result) => { if (!cancelled) setProducts(result); })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const figures = [
    { value: partners.length, label: text.figures.partners },
    { value: totalRealisations, label: text.figures.realisations },
    { value: portfolioCategories.length, label: text.figures.skills },
    { value: products.length, label: text.figures.products },
  ];

  return (
    <main className="shop-page about-page" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <SiteHeader locale={locale} onLocaleChange={changeLocale} />

      <section className="shop-intro about-hero">
        <p className="eyebrow"><span />{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
        <div className="portfolio-intro-actions">
          <Link className="button button-dark" href={`/devis?lang=${locale}`}>{text.quote}<span aria-hidden="true">↗</span></Link>
          <Link className="text-link" href={`/realisations?lang=${locale}`}>{text.gallery}<span aria-hidden="true">→</span></Link>
        </div>
        <dl className="about-kpis" ref={figuresRef}>
          {figures.map((figure) => (
            <div key={figure.label}>
              <dt>{figure.label}</dt>
              <dd><CountUp active={figuresInView} value={figure.value} /></dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section-wrap about-guide" aria-labelledby="about-guide-title">
        <h2 id="about-guide-title">{text.guideTitle}</h2>
        <ol className="about-flow">
          {text.guide.map(([title, body], index) => (
            <li key={title}>
              <span className="about-flow-step">{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section-wrap about-tree-section" aria-labelledby="about-tree-title">
        <div className="about-section-heading">
          <h2 id="about-tree-title">{text.treeTitle}</h2>
          <p>{text.treeIntro}</p>
        </div>
        <div className="about-tree">
          <div className="about-tree-root">Fast Print Sahline</div>
          <ul className="about-tree-poles">
            {poles.map((pole) => {
              const members = pole.categories.flatMap((id) => portfolioCategories.filter((category) => category.id === id));
              const poleTotal = members.reduce((total, category) => total + category.photos.length, 0);
              return (
                <li className="about-tree-pole" key={pole.id}>
                  <div className="about-tree-pole-head">
                    <strong>{text.poles[pole.id as keyof typeof text.poles]}</strong>
                    <span>{poleTotal}</span>
                  </div>
                  <ul>
                    {members.map((category) => (
                      <li key={category.id}>
                        <Link href={`/realisations?lang=${locale}#portfolio-${category.id}`}>
                          <span>{category.title[locale]}</span>
                          <b>{category.photos.length}</b>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
          <p className="about-tree-base">{text.base}</p>
        </div>
      </section>

      <section className="section-wrap about-figures" aria-labelledby="about-chart-title">
        <div className="about-charts">
          <figure className="about-chart">
            <h2 id="about-chart-title">{text.chartTitle}</h2>
            <figcaption>{text.chartIntro(totalRealisations)}</figcaption>
            <ol className={chartInView ? "about-bars is-visible" : "about-bars"} ref={chartRef}>
              {sortedCategories.map((category) => {
                const share = Math.round((category.photos.length / totalRealisations) * 100);
                return (
                  <li key={category.id} title={`${category.title[locale]} : ${category.photos.length} (${share} % ${text.share})`}>
                    <Link href={`/realisations?lang=${locale}#portfolio-${category.id}`}>
                      <span className="about-bar-label">{category.title[locale]}</span>
                      <span className="about-bar-track">
                        <i style={{ width: `${(category.photos.length / largestCategory) * 100}%` }} />
                      </span>
                      <span className="about-bar-value"><b>{category.photos.length}</b> <small>{share} %</small></span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </figure>
          <div className="about-products">
            <h2>{text.productsTitle} <span>{products.length}</span></h2>
            <ul>
              {products.map((product) => (
                <li key={product.id}>
                  <Link href={`/products/${product.slug}?lang=${locale}`}>
                    <span>{localized(product.translations, locale)}</span>
                    <small>{localized(product.category.translations, locale)}</small>
                  </Link>
                </li>
              ))}
            </ul>
            <p>{text.productsHint}</p>
          </div>
        </div>
      </section>

      <section className="section-wrap about-partners" aria-labelledby="about-partners-title">
        <div className="about-section-heading">
          <h2 id="about-partners-title">{text.partnersTitle} <span>{partners.length}</span></h2>
        </div>
        <ul className="about-partner-grid">
          {partners.map((partner) => (
            <li key={partner.name} title={partner.name}><PartnerLogo maxHeight={52} maxWidth={124} partner={partner} /></li>
          ))}
        </ul>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}
