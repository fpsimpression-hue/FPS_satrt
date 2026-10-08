"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { ServiceOrbit } from "@/components/service-orbit";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale, type Locale } from "@/lib/api";
import { faqContent } from "@/lib/faq";
import { portfolioCategories } from "@/lib/portfolio";

type Partner = {
  name: string;
  logo: string;
  crop: readonly [sourceWidth: number, sourceHeight: number, x: number, y: number, width: number, height: number];
};

type Testimonial = {
  quote: Record<Locale, string>;
  author: string;
  company?: string;
};

const partners: Partner[] = [
  { name: "Wafacash", logo: "/partners/wafacash.webp", crop: [139, 164, 0, 58, 138, 48] },
  { name: "AMED Groupe", logo: "/partners/amed-groupe.webp", crop: [180, 119, 10, 6, 162, 106] },
  { name: "Lambda Collège & Lycée", logo: "/partners/lambda.webp", crop: [156, 164, 10, 6, 132, 140] },
  { name: "Alsico", logo: "/partners/alsico.webp", crop: [180, 101, 0, 0, 178, 100] },
  { name: "SOMA", logo: "/partners/soma.jpg", crop: [180, 94, 26, 34, 130, 26] },
  { name: "Zoppas Industries", logo: "/partners/zoppas-industries.webp", crop: [180, 49, 8, 8, 162, 32] },
  { name: "Retro Fish", logo: "/partners/retro-fish.webp", crop: [180, 108, 6, 4, 170, 102] },
  { name: "Centre International Carthage Medical", logo: "/partners/centre-international-carthage-medical.webp", crop: [180, 158, 22, 18, 140, 118] },
  { name: "Flormar", logo: "/partners/flormar.webp", crop: [180, 46, 0, 0, 178, 44] },
  { name: "Sahara Beach Aquapark Resort", logo: "/partners/sahara-beach.webp", crop: [180, 114, 36, 6, 108, 102] },
  { name: "ONE Hotels & Resorts", logo: "/partners/one-hotels-resorts.webp", crop: [180, 180, 0, 42, 168, 92] },
  { name: "Skylla", logo: "/partners/skylla.webp", crop: [180, 56, 0, 0, 178, 54] },
  { name: "SEWS-TN", logo: "/partners/sews-tn.jpg", crop: [170, 151, 12, 12, 148, 120] },
];

// Ajouter ici uniquement des témoignages réels, publiés avec l’accord du client.
// La section s’affiche automatiquement dès qu’un témoignage est renseigné.
const testimonials: Testimonial[] = [];

// Produits affichés sur l’orbite du hero, dans l’ordre du portfolio.
const orbitProducts: Record<string, { image: string; label: Record<Locale, string> }> = {
  enseignes: { image: "30.jpg", label: { fr: "Enseignes", ar: "لافتات", en: "Signs" } },
  vehicules: { image: "02.jpg", label: { fr: "Véhicules", ar: "مركبات", en: "Vehicles" } },
  "grand-format": { image: "05.jpg", label: { fr: "Grand format", ar: "طباعة كبيرة", en: "Large format" } },
  textile: { image: "03.jpg", label: { fr: "Textile", ar: "منسوجات", en: "Textiles" } },
  "objets-cadeaux": { image: "04.jpg", label: { fr: "Trophées & cadeaux", ar: "كؤوس وهدايا", en: "Gifts & awards" } },
  "imprimes-papeterie": { image: "09.jpg", label: { fr: "Imprimés", ar: "مطبوعات", en: "Print" } },
  "decoration-tableaux": { image: "08.jpg", label: { fr: "Décoration", ar: "ديكور", en: "Decor" } },
  "plv-decoupe": { image: "03.jpg", label: { fr: "PLV & découpes", ar: "مجسّمات العرض", en: "Displays" } },
};

const workCovers: Record<string, { image: string; layout?: "feature" | "wide" }> = {
  enseignes: { image: "03.jpg", layout: "feature" },
  vehicules: { image: "02.jpg" },
  "grand-format": { image: "06.jpg" },
  textile: { image: "02.jpg" },
  "objets-cadeaux": { image: "04.jpg" },
  "imprimes-papeterie": { image: "04.jpg" },
  "decoration-tableaux": { image: "08.jpg", layout: "wide" },
  "plv-decoupe": { image: "03.jpg" },
};

const copy = {
  fr: {
    eyebrow: "Atelier d’impression & publicité · Sahline",
    headline: "Vos idées\nprennent forme.",
    intro: "Enseignes, habillage de véhicules, textile, objets personnalisés et imprimés : Fast Print Sahline conçoit et fabrique vos supports, de l’idée à la réalisation.",
    primary: "Demander un devis",
    secondary: "Voir nos réalisations",
    whatsapp: "Une question ? Écrivez-nous sur WhatsApp",
    assurances: ["Accompagnement graphique", "Fichier vérifié avant impression", "Retrait à l’atelier ou livraison"],
    signature: "« L’art de l’impression »",
    orbitLabel: "Nos produits",
    partners: "Ils nous font confiance",
    workEyebrow: "Nos savoir-faire",
    workTitle: "Tout commence par une idée.",
    workIntro: "Des enseignes lumineuses aux cadeaux d’entreprise, découvrez ce que nous fabriquons chaque jour à l’atelier.",
    workCta: "Voir toutes les réalisations",
    processEyebrow: "L’impression, en toute confiance",
    processTitle: "Votre commande, étape par étape.",
    processIntro: "Préparez votre projet en quatre étapes simples avec notre équipe.",
    steps: [
      ["01", "Choisissez votre produit", "Sélectionnez le support, le format, la quantité et les finitions."],
      ["02", "Envoyez votre fichier", "Transmettez votre visuel prêt à imprimer ou contactez-nous pour être accompagné."],
      ["03", "Confirmez votre commande", "Nous vérifions votre fichier et confirmons le prix ou le devis avant production."],
      ["04", "Récupérez votre commande", "Choisissez le retrait à l’atelier ou la livraison."],
    ],
    aboutEyebrow: "À propos de Fast Print Sahline",
    aboutTitle: "Impression, design et créations sur mesure.",
    aboutBody: "À Sahline, Fast Print Sahline réunit impression numérique, conception graphique et fabrication personnalisée : supports imprimés, enseignes, décoration événementielle et objets créés à votre image.",
    videoLabel: "Vidéo de présentation de l’atelier Fast Print Sahline",
    videoCaption: "L’atelier en images",
    pauseVideo: "Mettre la vidéo en pause",
    playVideo: "Lire la vidéo",
    promises: [
      ["Conception graphique", "Pas encore de visuel ? Notre équipe crée ou adapte votre fichier pour l’impression."],
      ["Contrôle avant production", "Chaque fichier est vérifié par l’atelier avant le lancement de l’impression."],
      ["Des prix clairs", "Un tarif s’affiche lorsqu’il est validé ; sinon, l’atelier vous prépare un devis."],
      ["Retrait ou livraison", "Récupérez votre commande à Sahline ou faites-la livrer. Paiement à la réception."],
    ],
    aboutCta: "Voir les produits et tarifs",
    testimonialsEyebrow: "La parole à nos clients",
    testimonialsTitle: "Ce que nos clients disent.",
    testimonialsIntro: "Des retours publiés avec l’accord de nos clients.",
    faqAll: "Toutes les questions",
  },
  ar: {
    eyebrow: "ورشة طباعة وإشهار · الساحلين",
    headline: "نحوّل أفكاركم\nإلى واقع.",
    intro: "لافتات، تغليف السيارات، منسوجات، هدايا مخصّصة ومطبوعات: تصمّم Fast Print Sahline موادكم وتنفّذها، من الفكرة إلى الإنجاز.",
    primary: "اطلبوا عرض سعر",
    secondary: "شاهدوا أعمالنا",
    whatsapp: "لديكم سؤال؟ راسلونا على واتساب",
    assurances: ["مرافقة في التصميم", "مراجعة الملف قبل الطباعة", "استلام من الورشة أو توصيل"],
    signature: "« فن الطباعة »",
    orbitLabel: "منتجاتنا",
    partners: "يثقون بنا",
    workEyebrow: "مجالات خبرتنا",
    workTitle: "كل شيء يبدأ بفكرة.",
    workIntro: "من اللافتات المضيئة إلى هدايا المؤسسات، اكتشفوا ما ننجزه كل يوم في ورشتنا.",
    workCta: "شاهدوا كل أعمالنا",
    processEyebrow: "الطباعة بكل ثقة",
    processTitle: "طلبكم، خطوة بخطوة.",
    processIntro: "حضّروا مشروعكم في أربع خطوات بسيطة مع فريقنا.",
    steps: [
      ["01", "اختاروا المنتج", "حدّدوا نوع المطبوع والمقاس والكمية والتشطيبات."],
      ["02", "أرسلوا الملف", "أرسلوا التصميم الجاهز للطباعة أو تواصلوا معنا للمساعدة."],
      ["03", "أكّدوا طلبكم", "نراجع الملف ونؤكد السعر أو عرض السعر قبل الإنتاج."],
      ["04", "استلموا طلبكم", "اختاروا الاستلام من الورشة أو التوصيل."],
    ],
    aboutEyebrow: "من نحن · Fast Print Sahline",
    aboutTitle: "طباعة وتصميم وإبداعات حسب الطلب.",
    aboutBody: "تجمع Fast Print Sahline في الساحلين بين الطباعة الرقمية والتصميم الجرافيكي والتصنيع المخصّص: المطبوعات واللافتات وديكورات المناسبات والمنتجات المصمّمة حسب هويتكم.",
    videoLabel: "فيديو تعريفي بورشة Fast Print Sahline",
    videoCaption: "الورشة بالصور",
    pauseVideo: "إيقاف الفيديو مؤقتاً",
    playVideo: "تشغيل الفيديو",
    promises: [
      ["التصميم الجرافيكي", "ليس لديكم تصميم بعد؟ يصمّم فريقنا ملفكم أو يجهّزه للطباعة."],
      ["مراجعة قبل الإنتاج", "تراجع الورشة كل ملف قبل بدء الطباعة."],
      ["أسعار واضحة", "يظهر السعر عند اعتماده، وإلا تُعدّ لكم الورشة عرض سعر."],
      ["استلام أو توصيل", "استلموا طلبكم من الساحلين أو اطلبوا توصيله، والدفع عند الاستلام."],
    ],
    aboutCta: "تصفحوا المنتجات والأسعار",
    testimonialsEyebrow: "آراء عملائنا",
    testimonialsTitle: "ماذا يقول عملاؤنا؟",
    testimonialsIntro: "آراء منشورة بموافقة عملائنا.",
    faqAll: "كل الأسئلة",
  },
  en: {
    eyebrow: "Print & advertising studio · Sahline",
    headline: "Ideas,\nmade visible.",
    intro: "Signs, vehicle graphics, textiles, custom gifts and printed materials: Fast Print Sahline designs and produces your projects, from first idea to finished piece.",
    primary: "Request a quote",
    secondary: "See our work",
    whatsapp: "Questions? Message us on WhatsApp",
    assurances: ["Design support", "Files checked before printing", "Workshop pickup or delivery"],
    signature: "“The art of printing”",
    orbitLabel: "Our products",
    partners: "Trusted by",
    workEyebrow: "What we make",
    workTitle: "Every project starts with an idea.",
    workIntro: "From illuminated signs to corporate gifts, discover what we produce in our workshop every day.",
    workCta: "See all our work",
    processEyebrow: "Print with confidence",
    processTitle: "Your order, step by step.",
    processIntro: "Get your project ready in four simple steps with our team.",
    steps: [
      ["01", "Choose your product", "Select the print item, size, quantity and finishes."],
      ["02", "Send your file", "Share your print-ready artwork or contact us for help."],
      ["03", "Confirm your order", "We check your file and confirm the price or quote before production."],
      ["04", "Collect your order", "Choose workshop collection or delivery."],
    ],
    aboutEyebrow: "About Fast Print Sahline",
    aboutTitle: "Printing, design and made-to-order creations.",
    aboutBody: "Based in Sahline, Fast Print Sahline brings together digital printing, graphic design and custom production: printed materials, signs, event decor and products made to reflect your identity.",
    videoLabel: "Fast Print Sahline workshop introduction video",
    videoCaption: "Inside the workshop",
    pauseVideo: "Pause video",
    playVideo: "Play video",
    promises: [
      ["Graphic design", "No artwork yet? Our team creates or adapts your file for print."],
      ["Checked before production", "The workshop reviews every file before printing begins."],
      ["Clear pricing", "A price appears once it is approved; otherwise, the workshop prepares a quote."],
      ["Pickup or delivery", "Collect your order in Sahline or have it delivered. Pay on receipt."],
    ],
    aboutCta: "Browse products and pricing",
    testimonialsEyebrow: "What our clients say",
    testimonialsTitle: "What our clients say.",
    testimonialsIntro: "Feedback published with our clients’ permission.",
    faqAll: "All questions",
  },
} as const;

function realisationCount(count: number, locale: Locale): string {
  if (locale === "fr") return `${count} ${count > 1 ? "réalisations" : "réalisation"}`;
  if (locale === "en") return `${count} ${count > 1 ? "projects" : "project"}`;
  if (count === 1) return "عمل واحد";
  if (count === 2) return "عملان";
  return `${count} ${count <= 10 ? "أعمال" : "عملاً"}`;
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 10.5 3.2 3L15 6.5" />
    </svg>
  );
}

function PromiseIcon({ index }: { index: number }) {
  const paths = [
    <><path d="m12 19 7-7 3 3-7 7-3-3Z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z" /><path d="m2 2 7.6 7.6" /><circle cx="11" cy="11" r="2" /></>,
    <><path d="M12 3 19 6v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
    <><path d="M3 7h11v9H3Z" /><path d="M14 10h4l3 3v3h-7Z" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  ];

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[index]}
    </svg>
  );
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoPausedByVisitor = useRef(false);
  const text = copy[locale];
  const faq = faqContent[locale];

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState(null, "", url);
  }

  function toggleVideo() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      videoPausedByVisitor.current = false;
      void video.play().catch((error: unknown) => {
        console.warn("La lecture de la vidéo a été bloquée.", error);
      });
    } else {
      videoPausedByVisitor.current = true;
      video.pause();
    }
  }

  useEffect(() => {
    setLocale(getLocale());
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      videoPausedByVisitor.current = true;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !videoPausedByVisitor.current) {
          video.muted = true;
          void video.play().catch((error: unknown) => {
            console.warn("La lecture automatique de la vidéo a été bloquée.", error);
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="home-page" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <SiteHeader locale={locale} onLocaleChange={changeLocale} />

      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero-copy">
          <p className="eyebrow"><span />{text.eyebrow}</p>
          <h1 id="home-hero-title">
            {text.headline.split("\n").map((line, index) => (
              <span className={index === 1 ? "home-hero-highlight" : undefined} key={line}>{line}</span>
            ))}
          </h1>
          <p className="home-hero-intro">{text.intro}</p>
          <div className="home-hero-actions">
            <a className="button button-dark" href={`/devis?lang=${locale}`}>
              {text.primary}<span aria-hidden="true">↗</span>
            </a>
            <a className="button button-outline" href={`/realisations?lang=${locale}`}>{text.secondary}</a>
          </div>
          <a className="home-hero-whatsapp" href="https://wa.me/21623267178" rel="noreferrer" target="_blank">
            <span className="home-online-dot" aria-hidden="true" />
            {text.whatsapp}
            <span aria-hidden="true">→</span>
          </a>
          <ul className="home-assurances">
            {text.assurances.map((item) => (
              <li key={item}><span aria-hidden="true"><CheckIcon /></span>{item}</li>
            ))}
          </ul>
        </div>

        <div className="home-orbit">
          <span className="home-orbit-track" aria-hidden="true" />
          <span className="home-orbit-dots" aria-hidden="true"><i /><i /><i /><i /></span>
          <div className="home-orbit-core">
            <Image alt="Fast Print Sahline" height={740} priority src="/fast-print-sahline.svg" width={1826} />
            <p className="home-orbit-signature">{text.signature}</p>
          </div>
          <ul className="home-orbit-ring" aria-label={text.orbitLabel}>
            {portfolioCategories.map((category, index) => {
              const product = orbitProducts[category.id];
              if (!product) return null;
              const angle = (360 / portfolioCategories.length) * index - 90;

              return (
                <li className="home-orbit-node" key={category.id} style={{ "--orbit-angle": `${angle}deg` } as CSSProperties}>
                  <a aria-label={category.title[locale]} href={`/realisations?lang=${locale}#portfolio-${category.id}`}>
                    <span className="home-orbit-photo">
                      <Image alt="" fill sizes="80px" src={`/portfolio/${category.id}/${product.image}`} />
                    </span>
                    <span className="home-orbit-label" aria-hidden="true">{product.label[locale]}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="partner-strip" aria-label={text.partners}>
        <p className="partner-heading">{text.partners}</p>
        <div className="partner-marquee">
          <div className="partner-track">
            {[0, 1].map((copyIndex) => (
              <div className="partner-group" aria-hidden={copyIndex === 1} key={copyIndex}>
                {partners.map((partner) => {
                  const [sourceWidth, sourceHeight, x, y, cropWidth, cropHeight] = partner.crop;
                  const scale = Math.min(145 / cropWidth, 58 / cropHeight);

                  return (
                    <div className="partner-logo" key={partner.name}>
                      <div
                        className="partner-logo-mark"
                        style={{ width: cropWidth * scale, height: cropHeight * scale }}
                      >
                        <Image
                          alt={partner.name}
                          height={sourceHeight}
                          sizes="(max-width: 600px) 120px, (max-width: 850px) 150px, 180px"
                          src={partner.logo}
                          width={sourceWidth}
                          style={{
                            height: `${(sourceHeight / cropHeight) * 100}%`,
                            left: `${-(x / cropWidth) * 100}%`,
                            maxWidth: "none",
                            objectFit: "contain",
                            position: "absolute",
                            top: `${-(y / cropHeight) * 100}%`,
                            width: `${(sourceWidth / cropWidth) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-work section-wrap" id="savoir-faire" aria-labelledby="home-work-title">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow"><span />{text.workEyebrow}</p>
            <h2 id="home-work-title">{text.workTitle}</h2>
          </div>
          <div>
            <p>{text.workIntro}</p>
            <a className="text-link" href={`/realisations?lang=${locale}`}>
              {text.workCta}<span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <ul className="home-work-grid">
          {portfolioCategories.map((category) => {
            const cover = workCovers[category.id] ?? { image: "01.jpg" };
            const large = cover.layout !== undefined;

            return (
              <li className={large ? `home-work-tile home-work-tile-${cover.layout}` : "home-work-tile"} key={category.id}>
                <a href={`/realisations?lang=${locale}#portfolio-${category.id}`}>
                  <Image
                    alt=""
                    fill
                    sizes={large ? "(max-width: 1000px) 92vw, 46vw" : "(max-width: 1000px) 46vw, 23vw"}
                    src={`/portfolio/${category.id}/${cover.image}`}
                  />
                  <span className="home-work-number" aria-hidden="true">{category.number}</span>
                  <span className="home-work-copy">
                    <strong>{category.title[locale]}</strong>
                    <small>{realisationCount(category.photos.length, locale)}</small>
                  </span>
                  <span className="home-work-arrow" aria-hidden="true">↗</span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <ServiceOrbit
        eyebrow={text.processEyebrow}
        intro={text.processIntro}
        locale={locale}
        steps={text.steps}
        title={text.processTitle}
      />

      <section className="home-atelier section-wrap" id="about-us" aria-labelledby="home-atelier-title">
        <div className="home-atelier-media">
          <video
            aria-label={text.videoLabel}
            loop
            muted
            onPause={() => setVideoPlaying(false)}
            onPlay={() => setVideoPlaying(true)}
            playsInline
            preload="metadata"
            ref={videoRef}
          >
            <source src="/videos/services-showcase.mov" />
          </video>
          <span className="home-atelier-caption">{text.videoCaption}</span>
          <button
            aria-label={videoPlaying ? text.pauseVideo : text.playVideo}
            className="home-video-toggle"
            onClick={toggleVideo}
            type="button"
          >
            {videoPlaying ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="3.6" height="14" rx="1" /><rect x="13.9" y="5" width="3.6" height="14" rx="1" /></svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
            )}
          </button>
        </div>
        <div className="home-atelier-copy">
          <p className="eyebrow"><span />{text.aboutEyebrow}</p>
          <h2 id="home-atelier-title">{text.aboutTitle}</h2>
          <p className="home-atelier-body">{text.aboutBody}</p>
          <ul className="home-promises">
            {text.promises.map(([title, body], index) => (
              <li id={index === 2 ? "tarifs" : undefined} key={title}>
                <span className="home-promise-icon"><PromiseIcon index={index} /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <a className="button button-dark" href={`/catalogue?lang=${locale}`}>
            {text.aboutCta}<span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section aria-labelledby="home-testimonials-title" className="home-testimonials section-wrap">
          <div className="showcase-heading">
            <div>
              <p className="eyebrow"><span />{text.testimonialsEyebrow}</p>
              <h2 id="home-testimonials-title">{text.testimonialsTitle}</h2>
            </div>
            <p>{text.testimonialsIntro}</p>
          </div>
          <div className="testimonial-marquee">
            <div className="testimonial-track">
              {[0, 1].map((copyIndex) => (
                <div className="testimonial-group" aria-hidden={copyIndex === 1} key={copyIndex}>
                  {testimonials.map((testimonial) => (
                    <figure className="testimonial-card" key={testimonial.author}>
                      <div className="testimonial-card-top">
                        <span className="testimonial-quote-mark" aria-hidden="true">”</span>
                      </div>
                      <blockquote>{testimonial.quote[locale]}</blockquote>
                      <figcaption>
                        <span className="testimonial-avatar" aria-hidden="true">{testimonial.author.charAt(0)}</span>
                        <strong>{testimonial.company ? `${testimonial.author} · ${testimonial.company}` : testimonial.author}</strong>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="faq faq-reference section-wrap" id="faq" aria-labelledby="home-faq-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span />{faq.eyebrow}</p>
            <h2 id="home-faq-title">{faq.title}</h2>
          </div>
          <p>{faq.intro}</p>
          <a className="text-link faq-all-link" href={`/faq?lang=${locale}`}>
            {text.faqAll}<span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="faq-list">
          {faq.questions.map(([question, answer]) => (
            <details className="faq-item" key={question}>
              <summary>{question}<span aria-hidden="true">+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}
