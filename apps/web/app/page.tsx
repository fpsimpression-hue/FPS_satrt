"use client";

import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ServiceOrbit } from "@/components/service-orbit";
import { useState } from "react";

type Language = "fr" | "ar" | "en";
type Partner = {
  name: string;
  logo: string;
  crop: readonly [sourceWidth: number, sourceHeight: number, x: number, y: number, width: number, height: number];
};

const partnerHeadings: Record<Language, string> = {
  fr: "Nos partenaires",
  ar: "شركاؤنا",
  en: "Our partners",
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

const copy = {
  fr: {
    eyebrow: "Impression numérique · Infographie · Design à Sahline",
    headline: "Vos idées\nprennent forme.",
    intro:
      "De la conception graphique à la fabrication, Fast Print Sahline personnalise vos supports : impression, enseignes, décoration événementielle et créations sur mesure.",
    artCreative: "CRÉATIVITÉ",
    artPrecision: "PRÉCISION",
    artInnovation: "INNOVATION",
    artSignature: "L’art de l’impression",
    explore: "Découvrir nos services",
    contact: "Comment ça se passe ?",
    note: "Un tarif précis dépend du produit et de ses finitions. Demandez un devis pour une combinaison non affichée.",
    categoriesTitle: "Tout commence par une idée.",
    categoriesIntro:
      "Des supports du quotidien aux créations qui vous ressemblent, découvrez les possibilités.",
    categories: [
      ["01", "Cartes de visite", "Une première impression soignée, à l’image de votre activité."],
      ["02", "Flyers & dépliants", "Faites circuler vos idées avec des formats qui attirent l’œil."],
      ["03", "Menus restaurant", "Des menus élégants, pensés pour mettre vos plats en valeur."],
      ["04", "Blocs-notes & carnets", "Des carnets personnalisés pour vos notes et votre marque."],
      ["05", "Stylos personnalisés", "Des objets utiles qui font voyager votre identité."],
      ["06", "Trophées & médailles", "Célébrez vos événements avec des créations sur mesure."],
      ["07", "Papiers à en-tête", "Enveloppes, factures, carnets, bons et tickets personnalisés."],
    ],
    promiseEyebrow: "L’impression, en toute confiance",
    promiseTitle: "Un vrai regard sur chaque création.",
    promiseBody:
      "Votre fichier est vérifié par notre équipe avant le lancement en production. Une question ou un tarif à confirmer ? Nous échangeons avec vous avant de démarrer.",
    steps: [
      ["01", "Choisissez", "Parcourez les produits et précisez vos options."],
      ["02", "Envoyez", "Transmettez votre fichier prêt à imprimer."],
      ["03", "Nous vérifions", "Notre équipe contrôle votre fichier avant production."],
      ["04", "Récupérez", "Choisissez le retrait ou la livraison."],
    ],
    footer: "Impression soignée. Idées sans limites.",
    admin: "Espace équipe",
    location: "Sahline, Tunisie",
    language: "Langue",
    faqEyebrow: "Questions fréquentes",
    faqTitle: "Les réponses avant de vous lancer.",
    faqIntro: "Besoin d’un tarif ou d’un conseil ? Voici comment se passe une demande chez Fast Print Sahline.",
    faqs: [
      ["Comment demander un devis ou passer commande ?", "Choisissez un produit dans le catalogue, précisez le format et les options, puis indiquez la quantité et vos coordonnées. Selon le tarif disponible pour votre choix, vous pourrez commander directement ou envoyer une demande de devis."],
      ["Comment le prix est-il calculé ?", "Le prix dépend du produit, de la quantité et des options choisies. Un tarif s’affiche lorsqu’une grille validée correspond à votre sélection ; sinon, vous pouvez demander un devis à l’atelier."],
      ["Quels fichiers puis-je transmettre ?", "Le formulaire accepte les fichiers PDF, PNG, JPEG et TIFF, jusqu’à 25 Mo. L’équipe vérifie le fichier avant le lancement en production."],
      ["Puis-je choisir la livraison ?", "Vous pouvez choisir le retrait à l’atelier ou la livraison. Pour une livraison, indiquez votre adresse dans le formulaire. Le paiement prévu sur le site se fait à la réception ou au retrait."],
      ["La production commence-t-elle dès l’envoi du formulaire ?", "Non. Votre demande et votre fichier sont vérifiés avant la production. Si un tarif ou un détail doit être confirmé, l’atelier échange avec vous avant de démarrer."],
    ],
    contactEyebrow: "Parlons de votre projet",
    contactTitle: "Une idée à imprimer ?",
    contactBody: "Décrivez-nous le support souhaité, la quantité et les finitions envisagées. Nous pourrons étudier votre demande.",
    phoneLabel: "Appelez-nous",
    emailLabel: "Écrivez-nous",
    locationLabel: "Atelier",
    contactLocation: "Sahline, Monastir, Tunisie",
    pricingEyebrow: "Des prix clairs",
    pricingTitle: "Un tarif adapté à votre projet.",
    pricingBody: "Les tarifs dépendent du produit, de la quantité et des finitions. Consultez le catalogue pour voir les prix disponibles ou demandez un devis pour vos options.",
    pricingAction: "Voir les produits",
  },
  ar: {
    eyebrow: "الطباعة الرقمية · التصميم الجرافيكي · فاست برينت الساحلين",
    headline: "نحوّل أفكاركم\nإلى واقع.",
    intro:
      "من التصميم الجرافيكي إلى التصنيع، نخصّص مطبوعاتكم ولافتاتكم وديكورات مناسباتكم ومنتجاتكم حسب الطلب.",
    artCreative: "إبداع",
    artPrecision: "دقّة",
    artInnovation: "ابتكار",
    artSignature: "فن الطباعة",
    explore: "اكتشفوا خدماتنا",
    contact: "كيف تتم العملية؟",
    note: "يتحدد السعر حسب المنتج وخيارات التشطيب. اطلبوا عرض سعر للخيارات غير المتاحة.",
    categoriesTitle: "كل شيء يبدأ بفكرة.",
    categoriesIntro: "من المطبوعات اليومية إلى الإبداعات التي تعبّر عنكم، اكتشفوا الإمكانيات.",
    categories: [
      ["01", "بطاقات الزيارة", "بطاقات أنيقة تعكس صورة نشاطكم."],
      ["02", "مطويات ومنشورات", "أوصلوا أفكاركم بمطبوعات تلفت الانتباه."],
      ["03", "قوائم المطاعم", "قوائم أنيقة تبرز أطباق مطعمكم."],
      ["04", "دفاتر ومفكرات", "دفاتر مخصّصة لملاحظاتكم وعلامتكم."],
      ["05", "أقلام مخصّصة", "أدوات عملية تحمل هويتكم."],
      ["06", "كؤوس وميداليات", "احتفلوا بمناسباتكم بتصاميم حسب الطلب."],
      ["07", "مطبوعات رسمية", "مغلفات وفواتير ودفاتر ووصولات مخصّصة."],
    ],
    promiseEyebrow: "طباعة بكل ثقة",
    promiseTitle: "كل تصميم يحظى بعناية حقيقية.",
    promiseBody:
      "يراجع فريقنا ملفكم قبل بدء الإنتاج. إذا كان لديكم سؤال أو سعر يحتاج إلى تأكيد، نتواصل معكم أولاً.",
    steps: [
      ["01", "اختاروا", "تصفّحوا المنتجات وحدّدوا الخيارات."],
      ["02", "أرسلوا", "أرسلوا ملفكم الجاهز للطباعة."],
      ["03", "نراجع", "يتحقق فريقنا من الملف قبل الإنتاج."],
      ["04", "استلموا", "اختاروا الاستلام أو التوصيل."],
    ],
    footer: "طباعة متقنة. أفكار بلا حدود.",
    admin: "مساحة الفريق",
    location: "الساحلين، تونس",
    language: "اللغة",
    faqEyebrow: "أسئلة شائعة",
    faqTitle: "إجابات قبل البدء.",
    faqIntro: "تحتاجون إلى سعر أو نصيحة؟ إليكم طريقة تقديم الطلب لدى Fast Print Sahline.",
    faqs: [
      ["كيف أطلب عرض سعر أو أقدّم طلباً؟", "اختاروا منتجاً من الكتالوج، وحدّدوا المقاس والخيارات والكمية، ثم أدخلوا بياناتكم. حسب توفر السعر لاختياراتكم، يمكنكم تأكيد الطلب أو إرسال طلب عرض سعر."],
      ["كيف يُحدّد السعر؟", "يعتمد السعر على المنتج والكمية والخيارات. يظهر السعر عند توفر تسعيرة معتمدة لاختياراتكم؛ وإلا يمكنكم إرسال طلب عرض سعر إلى الورشة."],
      ["ما أنواع الملفات التي يمكن إرسالها؟", "يقبل النموذج ملفات PDF وPNG وJPEG وTIFF بحجم أقصى 25 ميغابايت. يراجع الفريق الملف قبل بدء الإنتاج."],
      ["هل يمكن اختيار التوصيل؟", "يمكنكم اختيار الاستلام من الورشة أو التوصيل. عند اختيار التوصيل، يرجى إدخال العنوان في النموذج. يتم الدفع عند الاستلام أو التوصيل."],
      ["هل يبدأ الإنتاج فور إرسال النموذج؟", "لا. تتم مراجعة الطلب والملف قبل الإنتاج. إذا كان السعر أو أحد التفاصيل بحاجة إلى تأكيد، تتواصل معكم الورشة قبل البدء."],
    ],
    contactEyebrow: "لنتحدث عن مشروعكم",
    contactTitle: "لديكم فكرة للطباعة؟",
    contactBody: "أخبرونا عن المنتج والكمية والتشطيبات المطلوبة لندرس طلبكم.",
    phoneLabel: "اتصلوا بنا",
    emailLabel: "راسلونا",
    locationLabel: "الورشة",
    contactLocation: "الساحلين، المنستير، تونس",
    pricingEyebrow: "أسعار واضحة",
    pricingTitle: "سعر يناسب مشروعكم.",
    pricingBody: "تختلف الأسعار حسب المنتج والكمية والتشطيبات. تصفحوا الكتالوج للاطلاع على الأسعار المتاحة أو اطلبوا عرض سعر للخيارات الخاصة.",
    pricingAction: "تصفحوا المنتجات",
  },
  en: {
    eyebrow: "Digital printing · Graphic design · Sahline",
    headline: "Ideas,\nmade visible.",
    intro:
      "From graphic design to production, Fast Print Sahline personalises your print, signs, event decor and made-to-order creations.",
    artCreative: "CREATIVITY",
    artPrecision: "PRECISION",
    artInnovation: "INNOVATION",
    artSignature: "The art of printing",
    explore: "Explore our services",
    contact: "How does it work?",
    note: "Final pricing depends on the product and finishing options. Request a quote for options not listed.",
    categoriesTitle: "Every project starts with an idea.",
    categoriesIntro:
      "From everyday print essentials to one-of-a-kind creations, explore what's possible.",
    categories: [
      ["01", "Business cards", "A polished first impression, tailored to your business."],
      ["02", "Flyers & folded leaflets", "Share your message in formats that stand out."],
      ["03", "Restaurant menus", "Elegant menus designed to showcase your dishes."],
      ["04", "Notepads & notebooks", "Custom notebooks for your notes and your brand."],
      ["05", "Custom pens", "Useful promotional items that carry your identity."],
      ["06", "Trophies & medals", "Celebrate your events with made-to-order designs."],
      ["07", "Business stationery", "Custom letterheads, envelopes, invoices and tickets."],
    ],
    promiseEyebrow: "Print with confidence",
    promiseTitle: "A real person checks every design.",
    promiseBody:
      "Our team reviews your file before production begins. Need a confirmed price or have a question? We'll check with you first.",
    steps: [
      ["01", "Choose", "Browse products and select your options."],
      ["02", "Send", "Upload your print-ready file."],
      ["03", "We review", "Our team checks your file before production."],
      ["04", "Collect", "Choose collection or delivery."],
    ],
    footer: "Thoughtful printing. Ideas without limits.",
    admin: "Team workspace",
    location: "Sahline, Tunisia",
    language: "Language",
    faqEyebrow: "Frequently asked questions",
    faqTitle: "A few answers before you begin.",
    faqIntro: "Need a price or some guidance? Here is how a request works at Fast Print Sahline.",
    faqs: [
      ["How do I request a quote or place an order?", "Choose a product from the catalogue, select its format and options, then enter the quantity and your contact details. Depending on whether a matching price is available, you can place an order or send a quote request."],
      ["How is the price determined?", "Pricing depends on the product, quantity and selected options. A price appears when an approved rate matches your selection; otherwise, you can request a quote from the workshop."],
      ["Which files can I send?", "The form accepts PDF, PNG, JPEG and TIFF files up to 25 MB. The team checks your file before production begins."],
      ["Can I choose delivery?", "You can choose workshop collection or delivery. If you select delivery, enter your address in the form. Payment on the site is due at collection or delivery."],
      ["Does production start as soon as I submit the form?", "No. Your request and file are reviewed first. If pricing or a detail needs confirmation, the workshop will contact you before production starts."],
    ],
    contactEyebrow: "Tell us about your project",
    contactTitle: "Have an idea to print?",
    contactBody: "Tell us what you need, how many you need and any finishes you have in mind. We can review your request.",
    phoneLabel: "Call us",
    emailLabel: "Email us",
    locationLabel: "Workshop",
    contactLocation: "Sahline, Monastir, Tunisia",
    pricingEyebrow: "Clear pricing",
    pricingTitle: "Pricing that fits your project.",
    pricingBody: "Prices depend on the product, quantity and finishes. Browse the catalogue for available prices or request a quote for custom options.",
    pricingAction: "Browse products",
  },
} as const;

const aboutCopy: Record<Language, { eyebrow: string; title: string; body: string }> = {
  fr: {
    eyebrow: "À propos de Fast Print Sahline",
    title: "Impression, design et créations sur mesure.",
    body: "À Sahline, Fast Print Sahline réunit impression numérique, conception graphique et fabrication personnalisée : supports imprimés, enseignes, décoration événementielle et objets créés à votre image. Parcourez le catalogue ou échangez avec notre équipe pour préparer votre projet.",
  },
  ar: {
    eyebrow: "من نحن · Fast Print Sahline",
    title: "طباعة وتصميم وإبداعات حسب الطلب.",
    body: "تجمع Fast Print Sahline في الساحلين بين الطباعة الرقمية والتصميم الجرافيكي والتصنيع المخصّص: المطبوعات واللافتات وديكورات المناسبات والمنتجات المصمّمة حسب هويتكم. تصفحوا الكتالوج أو تواصلوا مع فريقنا لتحضير مشروعكم.",
  },
  en: {
    eyebrow: "About Fast Print Sahline",
    title: "Printing, design and made-to-order creations.",
    body: "Based in Sahline, Fast Print Sahline brings together digital printing, graphic design and custom production: printed materials, signs, event decor and products made to reflect your identity. Browse the catalogue or talk with our team about your project.",
  },
};

export default function Home() {
  const [language, setLanguage] = useState<Language>("fr");
  const text = copy[language];
  const about = aboutCopy[language];

  return (
    <main dir={language === "ar" ? "rtl" : "ltr"} lang={language}>
      <SiteHeader locale={language} onLocaleChange={setLanguage} />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span />{text.eyebrow}</p>
          <h1>{text.headline}</h1>
          <p className="hero-intro">{text.intro}</p>
          <div className="hero-actions">
            <a className="button button-dark" href={`/catalogue?lang=${language}`}>
              {text.explore}<span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="#how-it-works">{text.contact}<span aria-hidden="true">→</span></a>
          </div>
          <p className="hero-note">{text.note}</p>
        </div>
        <div
          className="hero-art"
          role="img"
          aria-label={`${text.artCreative}, ${text.artPrecision}, ${text.artInnovation} — ${text.artSignature}`}
        >
          <span className="hero-art-glow hero-art-glow-one" aria-hidden="true" />
          <span className="hero-art-glow hero-art-glow-two" aria-hidden="true" />
          <div className="hero-art-words" aria-hidden="true">
            <span className="hero-art-line hero-art-line-one">{text.artCreative}</span>
            <span className="hero-art-line hero-art-line-two">{text.artPrecision}</span>
            <span className="hero-art-line hero-art-line-three">{text.artInnovation}</span>
          </div>
          <span className="hero-art-signature" aria-hidden="true">
            <span className="hero-art-quote">«</span>{text.artSignature}<span className="hero-art-quote">»</span>
          </span>
        </div>
        <div className="hero-bottom">
          <span>01 — 07</span><span className="hero-bottom-line" /><span>{text.location}</span>
        </div>
      </section>

      <section className="partner-strip" aria-label={partnerHeadings[language]}>
        <p className="partner-heading">{partnerHeadings[language]}</p>
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

      <section className="services section-wrap" id="services">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span />FAST PRINT · IMPRESSION & PUBLICITÉ</p>
            <h2>{text.categoriesTitle}</h2>
          </div>
          <p>{text.categoriesIntro}</p>
        </div>
        <div className="category-grid">
          {text.categories.map(([number, title, description], index) => (
            <a className={`category-card category-${index + 1}`} href={`/catalogue?lang=${language}`} key={number}>
              <div className="category-top"><span>{number}</span><span className="category-icon" aria-hidden="true">{["▧", "▤", "▣", "▤", "✎", "♜", "▧"][index]}</span></div>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              <span className="card-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <a className="button button-dark catalogue-cta" href={`/catalogue?lang=${language}`}>
          {text.explore}<span aria-hidden="true">↗</span>
        </a>
      </section>

      <section className="quality">
        <div className="quality-inner">
          <div className="quality-copy">
            <p className="eyebrow"><span />{text.promiseEyebrow}</p>
            <h2>{text.promiseTitle}</h2>
            <p>{text.promiseBody}</p>
          </div>
          <div className="process-list" id="how-it-works">
            {text.steps.map(([number, title, description]) => (
              <div className="process-step" key={number}>
                <span className="step-number">{number}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
                <span className="step-check" aria-hidden="true">✓</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceOrbit locale={language} />

      <section className="about-section section-wrap" id="about-us">
        <p className="eyebrow"><span />{about.eyebrow}</p>
        <h2>{about.title}</h2>
        <p>{about.body}</p>
        <a className="button button-dark" href={`/services?lang=${language}`}>{text.explore}<span aria-hidden="true">↗</span></a>
      </section>

      <section className="pricing-section section-wrap" id="tarifs">
        <div>
          <p className="eyebrow"><span />{text.pricingEyebrow}</p>
          <h2>{text.pricingTitle}</h2>
          <p>{text.pricingBody}</p>
        </div>
        <a className="button button-dark" href={`/catalogue?lang=${language}`}>
          {text.pricingAction}<span aria-hidden="true">↗</span>
        </a>
      </section>

      <section className="faq section-wrap" id="faq">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span />{text.faqEyebrow}</p>
            <h2>{text.faqTitle}</h2>
          </div>
          <p>{text.faqIntro}</p>
        </div>
        <div className="faq-list">
          {text.faqs.map(([question, answer]) => (
            <details className="faq-item" key={question}>
              <summary>{question}<span aria-hidden="true">+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <SiteFooter locale={language} />
    </main>
  );
}
