"use client";

import { useEffect, useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale, type Locale } from "@/lib/api";

const copy = {
  fr: {
    eyebrow: "Impression numérique · Infographie · Design",
    title: "De la conception graphique au produit fini.",
    intro: "À Sahline, nous réunissons conception graphique, impression numérique et fabrication personnalisée : supports imprimés, enseignes, décoration événementielle et créations sur mesure.",
    explore: "Voir le catalogue",
    contact: "Parler de mon projet",
    services: [
      { number: "01", name: "Impression papier", intro: "Des supports soignés pour présenter votre activité et partager vos informations.", examples: ["Cartes de visite", "Flyers & dépliants", "Menus et papeterie"], art: "paper" },
      { number: "02", name: "Impression textile", intro: "Des créations personnalisées pour votre équipe, votre marque ou vos événements.", examples: ["Textiles personnalisés", "Séries adaptées à votre besoin", "Préparation de votre visuel"], art: "textile" },
      { number: "03", name: "Grand format & espaces", intro: "Des visuels conçus pour attirer le regard dans vos espaces commerciaux et lors de vos événements.", examples: ["Banderoles & supports grand format", "Habillage de stands et vitrines", "X-Banners personnalisés"], art: "format" },
      { number: "04", name: "Objets & créations", intro: "Des objets personnalisés et des pièces sur mesure pour marquer une occasion.", examples: ["Stylos personnalisés", "Trophées & médailles", "Créations à la demande"], art: "objects" },
      { number: "05", name: "Horloges murales LED", intro: "Des horloges en Plexiglas personnalisées qui associent décoration moderne, finitions soignées et éclairage lumineux.", examples: ["Design adapté à votre identité", "Plexiglas de qualité", "Éclairage LED et choix de couleurs"], art: "objects" },
      { number: "06", name: "Décoration événementielle", intro: "Des lettres et formes en PVC habillées de vinyle imprimé pour créer un décor élégant et à votre image.", examples: ["Découpes en PVC sur mesure", "Impression vinyle haute définition", "Mariages, fêtes et événements professionnels"], art: "format" },
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
    services: [
      { number: "01", name: "الطباعة على الورق", intro: "مطبوعات أنيقة للتعريف بنشاطكم ومشاركة معلوماتكم.", examples: ["بطاقات الأعمال", "منشورات ومطويات", "قوائم الطعام والمطبوعات المكتبية"], art: "paper" },
      { number: "02", name: "الطباعة على المنسوجات", intro: "تصاميم مخصصة لفريقكم أو علامتكم أو مناسباتكم.", examples: ["منسوجات مخصصة", "كميات تناسب احتياجكم", "إعداد التصميم للطباعة"], art: "textile" },
      { number: "03", name: "الطباعة الكبيرة وتجهيز المساحات", intro: "تصاميم تجذب الأنظار في المساحات التجارية والمناسبات.", examples: ["لافتات ومواد مطبوعة كبيرة", "تجهيز الأجنحة وواجهات المتاجر", "حوامل X-Banner مخصّصة"], art: "format" },
      { number: "04", name: "الهدايا والتصاميم الخاصة", intro: "أغراض مخصصة وقطع حسب الطلب للاحتفاء بالمناسبات.", examples: ["أقلام مخصصة", "كؤوس وميداليات", "تصاميم حسب الطلب"], art: "objects" },
      { number: "05", name: "ساعات حائط بإضاءة LED", intro: "ساعات حائط من الأكريليك بتصميم مخصّص، تجمع بين الديكور العصري والإضاءة الأنيقة.", examples: ["تصميم يعكس هويتكم", "أكريليك عالي الجودة", "إضاءة LED بألوان متعددة"], art: "objects" },
      { number: "06", name: "ديكور المناسبات", intro: "حروف وأشكال من PVC مغطاة بطباعة الفينيل لتصميم ديكور أنيق يعكس ذوقكم.", examples: ["قصّات PVC حسب الطلب", "طباعة فينيل عالية الدقة", "للأعراس والاحتفالات والمناسبات المهنية"], art: "format" },
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
    services: [
      { number: "01", name: "Paper printing", intro: "Polished print essentials for presenting your business and sharing information.", examples: ["Business cards", "Flyers & folded leaflets", "Menus & stationery"], art: "paper" },
      { number: "02", name: "Textile printing", intro: "Custom designs for your team, brand or events.", examples: ["Custom textiles", "Runs sized for your needs", "Artwork preparation"], art: "textile" },
      { number: "03", name: "Large format & spaces", intro: "Graphics designed to catch the eye in commercial spaces and at events.", examples: ["Banners & large-format displays", "Booth and window graphics", "Custom X-Banners"], art: "format" },
      { number: "04", name: "Custom objects & designs", intro: "Personalised objects and made-to-order pieces for special occasions.", examples: ["Custom pens", "Trophies & medals", "Made-to-order designs"], art: "objects" },
      { number: "05", name: "LED wall clocks", intro: "Custom Plexiglas clocks that pair modern decor, careful finishing and eye-catching LED lighting.", examples: ["A design made for your identity", "High-quality Plexiglas", "LED lighting with colour choices"], art: "objects" },
      { number: "06", name: "Event decoration", intro: "Custom PVC letters and shapes finished with printed vinyl for an elegant, personal event setting.", examples: ["Made-to-measure PVC cutouts", "High-definition vinyl printing", "Weddings, celebrations and business events"], art: "format" },
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
  services: { number: string; name: string; intro: string; examples: string[]; art: string }[];
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
        {text.services.map((service) => (
          <article className={`service-detail-card service-detail-${service.art}`} key={service.number}>
            <div className={`service-detail-art service-art-${service.art}`} aria-hidden="true">
              <span className="service-art-index">{service.number}</span>
              <span className="service-art-mark">FPS</span>
              <span className="service-art-caption">FAST PRINT · SAHLINE</span>
            </div>
            <div className="service-detail-copy">
              <p className="eyebrow"><span />{service.number}</p>
              <h2>{service.name}</h2>
              <p>{service.intro}</p>
              <ul>
                {service.examples.map((example) => <li key={example}>{example}</li>)}
              </ul>
              <a href={`/catalogue?lang=${locale}`}>{text.explore}<span aria-hidden="true">↗</span></a>
            </div>
          </article>
        ))}
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
        <div><p className="eyebrow"><span />FAST PRINT · SAHLINE</p><h2>{text.closing}</h2><p>{text.closingBody}</p></div>
        <a className="button button-dark" href={`/?lang=${locale}#contact`}>{text.contact}<span aria-hidden="true">↗</span></a>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
