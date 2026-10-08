"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale, type Locale } from "@/lib/api";

type ServiceId = "paper" | "textile" | "format" | "objects" | "clocks" | "events";

// Photo principale puis deux vignettes, toutes issues de public/portfolio.
// `focus` recadre la photo principale quand le sujet n’est pas au centre.
const serviceVisuals: Record<ServiceId, { gallery: string; photos: readonly [string, string, string]; focus?: string }> = {
  paper: { gallery: "imprimes-papeterie", photos: ["imprimes-papeterie/12.jpg", "imprimes-papeterie/04.jpg", "imprimes-papeterie/11.jpg"] },
  textile: { gallery: "textile", photos: ["textile/02.jpg", "textile/03.jpg", "textile/06.jpg"] },
  format: { gallery: "grand-format", photos: ["grand-format/11.jpg", "grand-format/03.jpg", "grand-format/06.jpg"] },
  objects: { gallery: "objets-cadeaux", photos: ["objets-cadeaux/04.jpg", "objets-cadeaux/05.jpg", "objets-cadeaux/08.jpg"] },
  clocks: { gallery: "enseignes", photos: ["enseignes/33.jpg", "imprimes-papeterie/07.jpg", "enseignes/30.jpg"] },
  events: { gallery: "plv-decoupe", photos: ["grand-format/12.jpg", "plv-decoupe/04.jpg", "plv-decoupe/02.jpg"], focus: "center 85%" },
};

const copy = {
  fr: {
    eyebrow: "Impression numérique · Infographie · Design",
    title: "De la conception graphique au produit fini.",
    intro: "À Sahline, nous réunissons conception graphique, impression numérique et fabrication personnalisée : supports imprimés, enseignes, décoration événementielle et créations sur mesure.",
    explore: "Voir le catalogue",
    contact: "Parler de mon projet",
    gallery: "Voir les réalisations",
    quote: "Demander un devis",
    services: [
      { id: "paper", name: "Impression papier", intro: "Des supports soignés pour présenter votre activité et partager vos informations.", examples: ["Cartes de visite", "Flyers & dépliants", "Menus et papeterie"] },
      { id: "textile", name: "Impression textile", intro: "Des créations personnalisées pour votre équipe, votre marque ou vos événements.", examples: ["T-shirts & tenues d’équipe", "Petites et grandes séries", "Préparation de votre visuel"] },
      { id: "format", name: "Grand format & espaces", intro: "Des visuels qui attirent le regard dans vos espaces commerciaux et lors de vos événements.", examples: ["Banderoles & bâches", "Stands et vitrines", "X-Banners & roll-ups"] },
      { id: "objects", name: "Objets & créations", intro: "Des objets personnalisés et des pièces sur mesure pour marquer une occasion.", examples: ["Stylos personnalisés", "Trophées & médailles", "Créations à la demande"] },
      { id: "clocks", name: "Horloges murales LED", intro: "Des horloges en Plexiglas à vos couleurs, avec un éclairage LED soigné.", examples: ["Design à votre identité", "Plexiglas de qualité", "Choix des couleurs LED"] },
      { id: "events", name: "Décoration événementielle", intro: "Des lettres et formes en PVC habillées de vinyle imprimé pour un décor élégant et à votre image.", examples: ["Découpes PVC sur mesure", "Vinyle haute définition", "Mariages, fêtes & entreprises"] },
    ],
    processEyebrow: "Notre méthode",
    processTitle: "Chaque projet avance étape par étape.",
    steps: [
      ["01", "Vous choisissez", "Parcourez les produits et indiquez vos formats et finitions."],
      ["02", "Vous nous envoyez votre fichier", "Ajoutez le visuel prêt à imprimer à votre demande."],
      ["03", "Nous vérifions", "L’atelier examine le fichier et confirme les détails ou le tarif si nécessaire."],
      ["04", "Vous récupérez votre commande", "Choisissez le retrait à l’atelier ou la livraison."],
    ],
    closing: "Un projet particulier ?",
    closingBody: "Décrivez-nous votre besoin. Nous étudierons ensemble le support et les options adaptés.",
  },
  ar: {
    eyebrow: "خدماتنا · فاست برينت الساحلين",
    title: "من التصميم إلى المنتج النهائي.",
    intro: "نجمع في الساحلين بين التصميم الجرافيكي والطباعة الرقمية والتصنيع حسب الطلب: المطبوعات واللافتات وديكورات المناسبات والإبداعات المخصّصة.",
    explore: "تصفحوا الكتالوج",
    contact: "تحدثوا عن مشروعكم",
    gallery: "شاهدوا الأعمال",
    quote: "اطلبوا عرض سعر",
    services: [
      { id: "paper", name: "الطباعة على الورق", intro: "مطبوعات أنيقة للتعريف بنشاطكم ومشاركة معلوماتكم.", examples: ["بطاقات الأعمال", "منشورات ومطويات", "قوائم الطعام والقرطاسية"] },
      { id: "textile", name: "الطباعة على المنسوجات", intro: "تصاميم مخصصة لفريقكم أو علامتكم أو مناسباتكم.", examples: ["قمصان وأزياء الفرق", "كميات صغيرة وكبيرة", "إعداد التصميم للطباعة"] },
      { id: "format", name: "الطباعة الكبيرة وتجهيز المساحات", intro: "تصاميم تجذب الأنظار في المساحات التجارية والمناسبات.", examples: ["لافتات وقماش مطبوع", "الأجنحة والواجهات", "حوامل X-Banner وRoll-up"] },
      { id: "objects", name: "الهدايا والتصاميم الخاصة", intro: "أغراض مخصصة وقطع حسب الطلب للاحتفاء بالمناسبات.", examples: ["أقلام مخصصة", "كؤوس وميداليات", "تصاميم حسب الطلب"] },
      { id: "clocks", name: "ساعات حائط بإضاءة LED", intro: "ساعات من الأكريليك بألوانكم، مع إضاءة LED أنيقة.", examples: ["تصميم يعكس هويتكم", "أكريليك عالي الجودة", "اختيار ألوان الإضاءة"] },
      { id: "events", name: "ديكور المناسبات", intro: "حروف وأشكال من PVC مغطاة بطباعة الفينيل لديكور أنيق يعكس ذوقكم.", examples: ["قصّات PVC حسب الطلب", "فينيل عالي الدقة", "أعراس واحتفالات ومؤسسات"] },
    ],
    processEyebrow: "طريقتنا",
    processTitle: "نتابع كل مشروع خطوة بخطوة.",
    steps: [
      ["01", "اختاروا", "تصفحوا المنتجات وحددوا المقاسات والتشطيبات."],
      ["02", "أرسلوا الملف", "أضيفوا التصميم الجاهز للطباعة إلى طلبكم."],
      ["03", "نراجع", "يفحص الفريق الملف ويؤكد التفاصيل أو السعر عند الحاجة."],
      ["04", "استلموا الطلب", "اختاروا الاستلام من الورشة أو التوصيل."],
    ],
    closing: "لديكم مشروع خاص؟",
    closingBody: "أخبرونا بما تحتاجونه لندرس معاً المنتج والخيارات المناسبة.",
  },
  en: {
    eyebrow: "Digital printing · Graphic design · Visual communication",
    title: "From graphic design to finished piece.",
    intro: "Based in Sahline, we bring graphic design, digital printing and custom production together for print, signs, event decor and made-to-order creations.",
    explore: "Browse the catalogue",
    contact: "Tell us about your project",
    gallery: "See our work",
    quote: "Request a quote",
    services: [
      { id: "paper", name: "Paper printing", intro: "Polished print essentials for presenting your business and sharing information.", examples: ["Business cards", "Flyers & leaflets", "Menus & stationery"] },
      { id: "textile", name: "Textile printing", intro: "Custom designs for your team, brand or events.", examples: ["T-shirts & team wear", "Small and large runs", "Artwork preparation"] },
      { id: "format", name: "Large format & spaces", intro: "Graphics that catch the eye in commercial spaces and at events.", examples: ["Banners & tarpaulins", "Booths & shop windows", "X-banners & roll-ups"] },
      { id: "objects", name: "Custom objects & designs", intro: "Personalised objects and made-to-order pieces for special occasions.", examples: ["Custom pens", "Trophies & medals", "Made-to-order designs"] },
      { id: "clocks", name: "LED wall clocks", intro: "Plexiglas clocks in your colours, with refined LED lighting.", examples: ["Designed for your identity", "High-quality Plexiglas", "Choice of LED colours"] },
      { id: "events", name: "Event decoration", intro: "PVC letters and shapes finished with printed vinyl for an elegant, personal setting.", examples: ["Made-to-measure PVC cutouts", "High-definition vinyl", "Weddings, parties & businesses"] },
    ],
    processEyebrow: "How we work",
    processTitle: "Every project moves forward, step by step.",
    steps: [
      ["01", "Choose", "Browse the products and select your formats and finishes."],
      ["02", "Send your file", "Attach your print-ready design to your request."],
      ["03", "We review", "The studio checks the file and confirms details or pricing when needed."],
      ["04", "Collect your order", "Choose collection at the workshop or delivery."],
    ],
    closing: "Have a special project?",
    closingBody: "Tell us what you need and we can work out the right product and options together.",
  },
} satisfies Record<Locale, {
  eyebrow: string;
  title: string;
  intro: string;
  explore: string;
  contact: string;
  gallery: string;
  quote: string;
  services: { id: ServiceId; name: string; intro: string; examples: string[] }[];
  processEyebrow: string;
  processTitle: string;
  steps: [string, string, string][];
  closing: string;
  closingBody: string;
}>;

export default function ServicesPage() {
  const [locale, setLocale] = useState<Locale>("fr");
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

  return (
    <main className="services-page" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <SiteHeader locale={locale} onLocaleChange={changeLocale} />
      <section className="services-hero">
        <p className="eyebrow"><span />{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
        <div className="hero-actions">
          <a className="button button-dark" href={`/catalogue?lang=${locale}`}>{text.explore}<span aria-hidden="true">↗</span></a>
          <a className="text-link" href={`/?lang=${locale}#contact`}>{text.contact}<span aria-hidden="true">→</span></a>
        </div>
      </section>
      <section className="service-detail-grid section-wrap" aria-label={text.eyebrow}>
        {text.services.map((service) => {
          const visual = serviceVisuals[service.id];
          const [mainPhoto, ...thumbnails] = visual.photos;

          return (
            <article className="service-detail-card" key={service.id}>
              <a
                aria-label={`${text.gallery} : ${service.name}`}
                className="service-detail-media"
                href={`/realisations?lang=${locale}#portfolio-${visual.gallery}`}
              >
                <Image
                  alt=""
                  className="service-media-main"
                  fill
                  sizes="(max-width: 700px) 92vw, 46vw"
                  src={`/portfolio/${mainPhoto}`}
                  style={visual.focus ? { objectPosition: visual.focus } : undefined}
                />
                <span className="service-media-thumbs" aria-hidden="true">
                  {thumbnails.map((photo) => (
                    <span key={photo}><Image alt="" fill sizes="96px" src={`/portfolio/${photo}`} /></span>
                  ))}
                </span>
                <span className="service-media-cta" aria-hidden="true">{text.gallery}<span>↗</span></span>
              </a>
              <div className="service-detail-copy">
                <h2>{service.name}</h2>
                <p>{service.intro}</p>
                <ul className="service-tags">
                  {service.examples.map((example) => <li key={example}>{example}</li>)}
                </ul>
                <a className="button button-dark" href={`/devis?lang=${locale}&projet=${visual.gallery}`}>{text.quote}<span aria-hidden="true">↗</span></a>
              </div>
            </article>
          );
        })}
      </section>
      <section className="service-process section-wrap">
        <div className="section-heading">
          <div><p className="eyebrow"><span />{text.processEyebrow}</p><h2>{text.processTitle}</h2></div>
        </div>
        <div className="service-process-grid">
          {text.steps.map(([number, title, description]) => (
            <article className="service-process-step" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="service-closing section-wrap">
        <div><h2>{text.closing}</h2><p>{text.closingBody}</p></div>
        <a className="button button-dark" href={`/?lang=${locale}#contact`}>{text.contact}<span aria-hidden="true">↗</span></a>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
