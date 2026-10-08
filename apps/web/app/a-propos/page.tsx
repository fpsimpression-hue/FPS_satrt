"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { PartnerLogo, partners } from "@/components/partner-logo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest, getLocale, type Locale, type Product } from "@/lib/api";
import { localCatalogueProducts } from "@/lib/local-catalog";
import { portfolioCategories } from "@/lib/portfolio";

const totalRealisations = portfolioCategories.reduce((total, category) => total + category.photos.length, 0);
const largestCategory = Math.max(...portfolioCategories.map((category) => category.photos.length));

const copy = {
  fr: {
    eyebrow: "À propos · Fast Print Sahline",
    title: "L’atelier qui donne forme à vos idées.",
    intro: "À Sahline, près de Monastir, Fast Print Sahline réunit conception graphique, impression numérique et fabrication sur mesure. Une seule équipe vous accompagne de l’idée jusqu’à la remise de votre commande.",
    quote: "Demander un devis",
    gallery: "Voir nos réalisations",
    pillarsTitle: "Ce qui nous guide",
    pillars: [
      ["Notre mission", "Rendre l’impression professionnelle simple et accessible : un conseil clair, des fichiers vérifiés et un travail soigné, quelle que soit la taille du projet."],
      ["Notre vision", "Devenir l’atelier de référence du Sahel pour la communication visuelle, en alliant savoir-faire artisanal et outils numériques."],
      ["Nos objectifs", "Répondre vite à chaque demande, livrer des supports fidèles à votre image et vous suivre à chaque étape, du devis à la remise."],
    ],
    servicesTitle: "Ce que nous faisons pour vous",
    services: [
      ["Conception graphique", "Création ou adaptation de votre logo, de vos visuels et de vos maquettes."],
      ["Impression numérique", "Cartes, flyers, affiches, menus, packaging et grand format."],
      ["Fabrication sur mesure", "Enseignes lumineuses, PLV, découpes, décoration et objets personnalisés."],
      ["Contrôle avant production", "Chaque fichier est vérifié par l’atelier avant l’impression."],
      ["Devis en ligne en 3 étapes", "Décrivez votre projet, ajoutez vos fichiers, recevez un prix adapté."],
      ["Retrait ou livraison", "À l’atelier de Sahline ou livré chez vous, avec un suivi WhatsApp."],
    ],
    figuresTitle: "Fast Print en chiffres",
    figures: { partners: "partenaires nous font confiance", realisations: "réalisations en photos", skills: "savoir-faire", products: "produits à commander en ligne" },
    realisationsTitle: "Nos réalisations par savoir-faire",
    productsTitle: "Nos produits en ligne",
    productsHint: "Et toute autre demande sur mesure via le devis en ligne.",
    partnersTitle: "Nos partenaires",
    partnersIntro: "Entreprises, établissements et commerces qui nous ont confié leur communication.",
  },
  ar: {
    eyebrow: "من نحن · Fast Print Sahline",
    title: "الورشة التي تحوّل أفكاركم إلى واقع.",
    intro: "في الساحلين قرب المنستير، تجمع Fast Print Sahline بين التصميم الجرافيكي والطباعة الرقمية والتصنيع حسب الطلب. فريق واحد يرافقكم من الفكرة حتى استلام طلبكم.",
    quote: "اطلبوا عرض سعر",
    gallery: "شاهدوا أعمالنا",
    pillarsTitle: "ما يوجّه عملنا",
    pillars: [
      ["مهمتنا", "جعل الطباعة الاحترافية بسيطة ومتاحة: نصيحة واضحة وملفات مراجَعة وعمل متقن مهما كان حجم المشروع."],
      ["رؤيتنا", "أن نكون الورشة المرجعية في الساحل للاتصال المرئي، بالجمع بين الحرفية والأدوات الرقمية."],
      ["أهدافنا", "الرد بسرعة على كل طلب، وتسليم مطبوعات وفية لهويتكم، ومرافقتكم في كل مرحلة من عرض السعر إلى الاستلام."],
    ],
    servicesTitle: "ما نقدّمه لكم",
    services: [
      ["التصميم الجرافيكي", "إنشاء أو تعديل شعاركم وتصاميمكم ونماذجكم."],
      ["الطباعة الرقمية", "بطاقات ومنشورات وملصقات وقوائم طعام وتغليف وطباعة كبيرة."],
      ["التصنيع حسب الطلب", "لافتات مضيئة ومجسّمات عرض وقصّات وديكور ومنتجات مخصّصة."],
      ["مراجعة قبل الإنتاج", "تراجع الورشة كل ملف قبل الطباعة."],
      ["عرض سعر في 3 خطوات", "صفوا مشروعكم وأضيفوا ملفاتكم واحصلوا على سعر مناسب."],
      ["استلام أو توصيل", "من ورشة الساحلين أو إلى عنوانكم، مع متابعة عبر واتساب."],
    ],
    figuresTitle: "Fast Print بالأرقام",
    figures: { partners: "شركاء يثقون بنا", realisations: "عملاً منجزاً بالصور", skills: "مجالات خبرة", products: "منتجات للطلب عبر الإنترنت" },
    realisationsTitle: "أعمالنا حسب المجال",
    productsTitle: "منتجاتنا عبر الإنترنت",
    productsHint: "وكل طلب آخر حسب المقاس عبر عرض السعر.",
    partnersTitle: "شركاؤنا",
    partnersIntro: "مؤسسات وشركات ومحلات أوكلت إلينا اتصالها المرئي.",
  },
  en: {
    eyebrow: "About · Fast Print Sahline",
    title: "The workshop that gives shape to your ideas.",
    intro: "In Sahline, near Monastir, Fast Print Sahline brings graphic design, digital printing and custom production together. One team takes you from first idea to collecting your order.",
    quote: "Request a quote",
    gallery: "See our work",
    pillarsTitle: "What guides us",
    pillars: [
      ["Our mission", "Make professional printing simple and accessible: clear advice, checked files and careful work, whatever the size of the project."],
      ["Our vision", "Become the reference workshop in the Sahel for visual communication, combining craftsmanship and digital tools."],
      ["Our goals", "Answer every request quickly, deliver work true to your brand and follow you at every step, from quote to handover."],
    ],
    servicesTitle: "What we do for you",
    services: [
      ["Graphic design", "We create or adapt your logo, artwork and mock-ups."],
      ["Digital printing", "Cards, flyers, posters, menus, packaging and large format."],
      ["Custom production", "Illuminated signs, displays, cutouts, decor and custom items."],
      ["Checked before production", "The workshop reviews every file before printing."],
      ["Online quote in 3 steps", "Describe your project, add your files, get the right price."],
      ["Pickup or delivery", "At our Sahline workshop or delivered, with WhatsApp updates."],
    ],
    figuresTitle: "Fast Print in figures",
    figures: { partners: "partners trust us", realisations: "projects photographed", skills: "specialities", products: "products to order online" },
    realisationsTitle: "Our work by speciality",
    productsTitle: "Our products online",
    productsHint: "Plus any custom request through the online quote.",
    partnersTitle: "Our partners",
    partnersIntro: "Companies, schools and shops that trusted us with their communication.",
  },
} as const;

const pillarIcons: ReactNode[] = [
  <path d="M12 3 4 7v5c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V7Z M9 12l2 2 4-4" key="mission" />,
  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" key="vision" />,
  <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M12 12h.01" key="goals" />,
];

export default function AboutPage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [products, setProducts] = useState<Product[]>(localCatalogueProducts);
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
      </section>

      <section className="section-wrap about-pillars" aria-labelledby="about-pillars-title">
        <h2 id="about-pillars-title">{text.pillarsTitle}</h2>
        <div className="about-pillar-grid">
          {text.pillars.map(([title, body], index) => (
            <article className="about-pillar" key={title}>
              <span className="about-pillar-icon">
                <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">{pillarIcons[index]}</svg>
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-wrap about-figures" aria-labelledby="about-figures-title">
        <h2 id="about-figures-title">{text.figuresTitle}</h2>
        <dl className="about-figure-grid">
          {figures.map((figure) => (
            <div className="about-figure" key={figure.label}>
              <dt>{figure.label}</dt>
              <dd>{figure.value}</dd>
            </div>
          ))}
        </dl>
        <div className="about-breakdowns">
          <div className="about-breakdown">
            <h3>{text.realisationsTitle}</h3>
            <ul>
              {portfolioCategories.map((category) => (
                <li key={category.id}>
                  <Link href={`/realisations?lang=${locale}#portfolio-${category.id}`}>
                    <span>{category.title[locale]}</span>
                    <b>{category.photos.length}</b>
                    <i aria-hidden="true" style={{ width: `${(category.photos.length / largestCategory) * 100}%` }} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="about-breakdown">
            <h3>{text.productsTitle}</h3>
            <ul className="about-product-list">
              {products.map((product) => (
                <li key={product.id}>
                  <Link href={`/products/${product.slug}?lang=${locale}`}>
                    <span>{product.translations[locale] || product.translations.fr}</span>
                    <small>{product.category.translations[locale] || product.category.translations.fr}</small>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="about-hint">{text.productsHint}</p>
          </div>
        </div>
      </section>

      <section className="section-wrap about-services" aria-labelledby="about-services-title">
        <h2 id="about-services-title">{text.servicesTitle}</h2>
        <ul className="about-service-grid">
          {text.services.map(([title, body]) => (
            <li key={title}><h3>{title}</h3><p>{body}</p></li>
          ))}
        </ul>
      </section>

      <section className="section-wrap about-partners" aria-labelledby="about-partners-title">
        <div className="about-partners-heading">
          <h2 id="about-partners-title">{text.partnersTitle} <span>{partners.length}</span></h2>
          <p>{text.partnersIntro}</p>
        </div>
        <ul className="about-partner-grid">
          {partners.map((partner) => (
            <li key={partner.name} title={partner.name}><PartnerLogo maxHeight={56} maxWidth={130} partner={partner} /></li>
          ))}
        </ul>
      </section>


      <SiteFooter locale={locale} />
    </main>
  );
}
