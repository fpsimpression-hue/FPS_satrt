"use client";

import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale, type Locale } from "@/lib/api";

const content = {
  fr: {
    eyebrow: "Questions fréquentes",
    title: "Les réponses avant de vous lancer.",
    intro: "Besoin d’un tarif ou d’un conseil ? Voici comment se passe une demande chez Fast Print Sahline.",
    questions: [
      ["Comment demander un devis ou passer commande ?", "Choisissez un produit dans le catalogue, précisez le format et les options, puis indiquez la quantité et vos coordonnées. Selon le tarif disponible pour votre choix, vous pourrez commander directement ou envoyer une demande de devis."],
      ["Comment le prix est-il calculé ?", "Le prix dépend du produit, de la quantité et des options choisies. Un tarif s’affiche lorsqu’une grille validée correspond à votre sélection ; sinon, vous pouvez demander un devis à l’atelier."],
      ["Quels fichiers puis-je transmettre ?", "Le formulaire accepte les fichiers PDF, PNG, JPEG et TIFF, jusqu’à 25 Mo. L’équipe vérifie le fichier avant le lancement en production."],
      ["Puis-je choisir la livraison ?", "Vous pouvez choisir le retrait à l’atelier ou la livraison. Pour une livraison, indiquez votre adresse dans le formulaire. Le paiement prévu sur le site se fait à la réception ou au retrait."],
      ["La production commence-t-elle dès l’envoi du formulaire ?", "Non. Votre demande et votre fichier sont vérifiés avant la production. Si un tarif ou un détail doit être confirmé, l’atelier échange avec vous avant de démarrer."],
    ],
  },
  ar: {
    eyebrow: "أسئلة شائعة",
    title: "إجابات قبل البدء.",
    intro: "تحتاجون إلى سعر أو نصيحة؟ إليكم طريقة تقديم الطلب لدى Fast Print Sahline.",
    questions: [
      ["كيف أطلب عرض سعر أو أقدّم طلباً؟", "اختاروا منتجاً من الكتالوج، وحدّدوا المقاس والخيارات والكمية، ثم أدخلوا بياناتكم. حسب توفر السعر لاختياراتكم، يمكنكم تأكيد الطلب أو إرسال طلب عرض سعر."],
      ["كيف يُحدّد السعر؟", "يعتمد السعر على المنتج والكمية والخيارات. يظهر السعر عند توفر تسعيرة معتمدة لاختياراتكم؛ وإلا يمكنكم إرسال طلب عرض سعر إلى الورشة."],
      ["ما أنواع الملفات التي يمكن إرسالها؟", "يقبل النموذج ملفات PDF وPNG وJPEG وTIFF بحجم أقصى 25 ميغابايت. يراجع الفريق الملف قبل بدء الإنتاج."],
      ["هل يمكن اختيار التوصيل؟", "يمكنكم اختيار الاستلام من الورشة أو التوصيل. عند اختيار التوصيل، يرجى إدخال العنوان في النموذج. يتم الدفع عند الاستلام أو التوصيل."],
      ["هل يبدأ الإنتاج فور إرسال النموذج؟", "لا. تتم مراجعة الطلب والملف قبل الإنتاج. إذا كان السعر أو أحد التفاصيل بحاجة إلى تأكيد، تتواصل معكم الورشة قبل البدء."],
    ],
  },
  en: {
    eyebrow: "Frequently asked questions",
    title: "A few answers before you begin.",
    intro: "Need a price or some guidance? Here is how a request works at Fast Print Sahline.",
    questions: [
      ["How do I request a quote or place an order?", "Choose a product from the catalogue, select its format and options, then enter the quantity and your contact details. Depending on whether a matching price is available, you can place an order or send a quote request."],
      ["How is the price determined?", "Pricing depends on the product, quantity and selected options. A price appears when an approved rate matches your selection; otherwise, you can request a quote from the workshop."],
      ["Which files can I send?", "The form accepts PDF, PNG, JPEG and TIFF files up to 25 MB. The team checks your file before production begins."],
      ["Can I choose delivery?", "You can choose workshop collection or delivery. If you select delivery, enter your address in the form. Payment on the site is due at collection or delivery."],
      ["Does production start as soon as I submit the form?", "No. Your request and file are reviewed first. If pricing or a detail needs confirmation, the workshop will contact you before production starts."],
    ],
  },
} satisfies Record<Locale, { eyebrow: string; title: string; intro: string; questions: string[][] }>;

export default function FaqPage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const text = content[locale];

  useEffect(() => setLocale(getLocale()), []);

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState(null, "", url);
  }

  return (
    <main className="shop-page" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <SiteHeader locale={locale} onLocaleChange={changeLocale} />
      <section className="faq-page section-wrap">
        <div className="faq-page-heading">
          <p className="eyebrow"><span />{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
        </div>
        <div className="faq-list">
          {text.questions.map(([question, answer]) => (
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
