"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ServiceOrbit } from "@/components/service-orbit";
import { useState } from "react";

type Language = "fr" | "ar" | "en";

const partnerHeadings: Record<Language, string> = {
  fr: "Nos partenaires",
  ar: "شركاؤنا",
  en: "Our partners",
};

const copy = {
  fr: {
    eyebrow: "Votre atelier d’impression à Sahline",
    headline: "Tout en papier,\npour vos idées.",
    intro:
      "Du premier croquis au produit fini, nous donnons vie à vos projets avec une impression soignée et des créations personnalisées.",
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
  },
  ar: {
    eyebrow: "ورشة الطباعة الخاصة بكم في الساحلين",
    headline: "أفكاركم\nعلى الورق.",
    intro:
      "من الفكرة الأولى إلى المنتج النهائي، نساعدكم على إنجاز مشاريعكم بطباعة متقنة وتصاميم مخصّصة.",
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
  },
  en: {
    eyebrow: "Your print studio in Sahline",
    headline: "Print your ideas.\nMake them yours.",
    intro:
      "From your first sketch to the finished product, we bring your projects to life with careful printing and personal touches.",
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
  },
} as const;

export default function Home() {
  const [language, setLanguage] = useState<Language>("fr");
  const text = copy[language];

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
        <div className="hero-art" aria-label="Supports imprimés Fast Print">
          <div className="art-paper paper-back"><span>IDEAS<br />IN PRINT</span></div>
          <div className="art-paper paper-front">
            <span className="art-sun" />
            <span className="art-shape" />
            <span className="art-lines">MAKE<br />IT<br />YOURS</span>
            <span className="art-caption">FAST PRINT · SAHLINE</span>
          </div>
          <span className="art-orbit orbit-one" />
          <span className="art-orbit orbit-two" />
          <span className="art-spark">✳</span>
          <span className="art-dot" />
          <span className="art-label">PRINT<br />YOUR<br />IDEA</span>
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
                {Array.from({ length: 8 }, (_, index) => (
                  <span className={`partner-wordmark partner-wordmark-${index % 4}`} key={index}>LOGO</span>
                ))}
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
