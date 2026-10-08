import { assetUrl, localized, type Locale, type Product } from "@/lib/api";
import { faqAnchor, faqContent } from "@/lib/faq";
import { portfolioCategories } from "@/lib/portfolio";
import { prepareDoc, searchDocs, type PreparedDoc, type SearchField } from "@/lib/search";

export type SiteResultKind = "category" | "product" | "page" | "faq" | "work";
export type SiteResult = {
  id: string;
  kind: SiteResultKind;
  title: string;
  subtitle: string;
  href: string;
  image?: string;
  external?: boolean;
  action?: { label: string; href: string };
};

const LOCALES: Locale[] = ["fr", "ar", "en"];

export const searchGroupLabels: Record<Locale, Record<SiteResultKind, string>> = {
  fr: { category: "Nos savoir-faire", product: "Produits à commander", page: "Pages utiles", faq: "Questions fréquentes", work: "Réalisations en photos" },
  ar: { category: "مجالات خبرتنا", product: "منتجات للطلب", page: "صفحات مفيدة", faq: "أسئلة شائعة", work: "أعمال بالصور" },
  en: { category: "What we make", product: "Products to order", page: "Useful pages", faq: "Frequently asked questions", work: "Photos of our work" },
};

const quoteLabel: Record<Locale, string> = { fr: "Devis", ar: "عرض سعر", en: "Quote" };
const categorySubtitle: Record<Locale, (count: number) => string> = {
  fr: (count) => `Savoir-faire · ${count} réalisations`,
  ar: (count) => `مجال خبرة · ${count} عمل`,
  en: (count) => `Speciality · ${count} projects`,
};
const productSubtitle: Record<Locale, string> = { fr: "Produit · prix en ligne ou devis", ar: "منتج · سعر مباشر أو عرض سعر", en: "Product · online price or quote" };

// Words customers actually type, in the three languages, for each speciality.
const categoryKeywords: Record<string, string> = {
  enseignes: "enseigne lumineuse néon neon led panneau façade signalétique plaque porte lettres relief 3d caisson logo mural totem horloge sign signage shopfront lightbox لافتة لافتات مضيئة نيون واجهة لوحة إشارات حروف بارزة شعار",
  vehicules: "flocage véhicule voiture auto camion utilitaire camionnette covering adhésif marquage habillage wrap car van truck sticker سيارة سيارات تغليف ملصقات شاحنة",
  "grand-format": "bâche banderole roll-up rollup kakemono x-banner affiche poster stand salon exposition drapeau oriflamme beach flag événement mariage arche décor banner flag لافتة قماشية رول أب ملصق معرض أعلام مناسبة عرس",
  textile: "t-shirt tshirt tee-shirt teeshirt maillot polo sweat hoodie casquette tablier tenue uniforme équipe broderie sérigraphie flocage textile vêtement shirt cap apron uniform قميص قمصان تيشرت ملابس زي أزياء",
  "objets-cadeaux": "trophée coupe médaille mug tasse porte-clés porte clé stylo cadeau gravure plaque souvenir entreprise trophy medal keyring pen gift كأس كؤوس ميدالية كوب هدية هدايا نقش قلم",
  "imprimes-papeterie": "carte de visite flyer flyers dépliant prospectus tract brochure menu catalogue papeterie en-tête enveloppe sac packaging emballage boîte étiquette sticker autocollant calendrier carnet agenda business card leaflet label box بطاقة بطاقات أعمال منشور مطوية قائمة طعام تغليف ملصق رزنامة كيس",
  "decoration-tableaux": "tableau toile calligraphie arabe déco décoration mural cadre plexiglas doré salon art painting canvas wall decor لوحة لوحات خط عربي ديكور جداري إطار",
  "plv-decoupe": "plv présentoir découpe pvc comptoir silhouette personnage display stand vitrine animaux cutout counter مجسم قص pvc حامل عرض منضدة",
};

const categoryCovers: Record<string, string> = {
  enseignes: "/portfolio/enseignes/08.jpg",
  vehicules: "/portfolio/vehicules/02.jpg",
  "grand-format": "/portfolio/grand-format/11.jpg",
  textile: "/portfolio/textile/02.jpg",
  "objets-cadeaux": "/portfolio/objets-cadeaux/04.jpg",
  "imprimes-papeterie": "/portfolio/imprimes-papeterie/04.jpg",
  "decoration-tableaux": "/portfolio/decoration-tableaux/08.jpg",
  "plv-decoupe": "/portfolio/plv-decoupe/03.jpg",
};

// Extra words for catalogue products, keyed by slug.
const productKeywords: Record<string, string> = {
  "cartes-de-visite": "carte visite business card bristol بطاقة أعمال",
  flyers: "flyer dépliant prospectus tract leaflet منشور مطوية",
  affiches: "affiche poster a3 a2 ملصق",
  "t-shirt-personnalise": "tshirt tee-shirt teeshirt maillot shirt قميص قمصان تيشرت",
  "mug-personnalise": "mug tasse cup كوب أكواب",
  banderole: "bâche banderole banner لافتة قماشية",
};

type PageDef = { id: string; href: (locale: Locale) => string; title: Record<Locale, string>; subtitle: Record<Locale, string>; keywords: string; external?: boolean };

const pages: PageDef[] = [
  {
    id: "devis",
    href: (locale) => `/devis?lang=${locale}`,
    title: { fr: "Demander un devis", ar: "طلب عرض سعر", en: "Request a quote" },
    subtitle: { fr: "Votre projet en 3 étapes, sans engagement", ar: "مشروعكم في 3 خطوات دون التزام", en: "Your project in 3 steps, no commitment" },
    keywords: "devis prix tarif combien coût estimation demande commande projet sur mesure personnalisé quote price cost estimate عرض سعر ثمن كم تكلفة طلب",
  },
  {
    id: "contact",
    href: (locale) => `/?lang=${locale}#contact`,
    title: { fr: "Contact et adresse de l’atelier", ar: "الاتصال وعنوان الورشة", en: "Contact and workshop address" },
    subtitle: { fr: "+216 23 267 178 · Sahline, Monastir", ar: "+216 23 267 178 · الساحلين، المنستير", en: "+216 23 267 178 · Sahline, Monastir" },
    keywords: "contact téléphone tel numéro appeler adresse localisation où carte plan maps email mail atelier sahline monastir horaires phone address location اتصال هاتف رقم عنوان موقع الساحلين المنستير بريد",
  },
  {
    id: "whatsapp",
    href: () => "https://wa.me/21623267178",
    title: { fr: "Écrire sur WhatsApp", ar: "الكتابة عبر واتساب", en: "Message us on WhatsApp" },
    subtitle: { fr: "Réponse directe de l’atelier", ar: "رد مباشر من الورشة", en: "Direct answer from the workshop" },
    keywords: "whatsapp message chat discuter écrire واتساب رسالة محادثة",
    external: true,
  },
  {
    id: "catalogue",
    href: (locale) => `/catalogue?lang=${locale}`,
    title: { fr: "Catalogue et tarifs", ar: "الكتالوج والأسعار", en: "Catalogue and prices" },
    subtitle: { fr: "Produits à commander en ligne", ar: "منتجات للطلب عبر الإنترنت", en: "Products to order online" },
    keywords: "catalogue produits prix tarifs commander acheter boutique en ligne shop order buy كتالوج منتجات أسعار شراء",
  },
  {
    id: "realisations",
    href: (locale) => `/realisations?lang=${locale}`,
    title: { fr: "Toutes nos réalisations", ar: "كل أعمالنا", en: "All our work" },
    subtitle: { fr: "Galerie photos de l’atelier", ar: "معرض صور الورشة", en: "Workshop photo gallery" },
    keywords: "réalisations portfolio galerie photos exemples travaux références portfolio gallery work examples أعمال صور معرض",
  },
  {
    id: "services",
    href: (locale) => `/services?lang=${locale}`,
    title: { fr: "Nos services", ar: "خدماتنا", en: "Our services" },
    subtitle: { fr: "Impression, design et fabrication", ar: "طباعة وتصميم وتصنيع", en: "Printing, design and production" },
    keywords: "services prestations impression numérique design infographie conception graphique création logo graphic design printing خدمات طباعة تصميم جرافيك",
  },
  {
    id: "faq",
    href: (locale) => `/faq?lang=${locale}`,
    title: { fr: "Questions fréquentes", ar: "الأسئلة الشائعة", en: "Frequently asked questions" },
    subtitle: { fr: "Fichiers, livraison, paiement", ar: "الملفات والتوصيل والدفع", en: "Files, delivery, payment" },
    keywords: "faq aide question réponse help أسئلة مساعدة",
  },
];

// Ranking nudges: specialities and products answer most searches better than single photos.
const kindBoost: Record<SiteResultKind, number> = { category: 0.6, product: 0.5, page: 0.3, faq: 0.1, work: -0.3 };
const kindLimit: Record<SiteResultKind, number> = { category: 4, product: 5, page: 3, faq: 3, work: 4 };

function otherTitles(titles: Partial<Record<Locale, string>>, locale: Locale): SearchField[] {
  return LOCALES.filter((other) => other !== locale && titles[other]).map((other) => ({ text: titles[other] ?? "", weight: 2.4 }));
}

export function buildSiteIndex(locale: Locale, products: Product[]): PreparedDoc<SiteResult>[] {
  const docs: PreparedDoc<SiteResult>[] = [];

  for (const category of portfolioCategories) {
    docs.push(prepareDoc<SiteResult>(
      {
        id: `category-${category.id}`,
        kind: "category",
        title: category.title[locale],
        subtitle: categorySubtitle[locale](category.photos.length),
        href: `/realisations?lang=${locale}#portfolio-${category.id}`,
        image: categoryCovers[category.id],
        action: { label: quoteLabel[locale], href: `/devis?lang=${locale}&projet=${category.id}` },
      },
      [{ text: category.title[locale], weight: 3 }, ...otherTitles(category.title, locale), { text: categoryKeywords[category.id] ?? "", weight: 1.8 }],
    ));
    category.photos.forEach((photo, index) => {
      docs.push(prepareDoc<SiteResult>(
        {
          id: `work-${category.id}-${index}`,
          kind: "work",
          title: photo.alt,
          subtitle: category.title[locale],
          href: `/realisations?lang=${locale}#portfolio-${category.id}`,
          image: `/portfolio/${category.id}/${String(index + 1).padStart(2, "0")}.jpg`,
        },
        [{ text: photo.alt, weight: 2 }, { text: category.title[locale], weight: 0.8 }],
      ));
    });
  }

  for (const product of products) {
    const image = product.images.find((item) => item.is_primary) ?? product.images[0];
    const optionWords = product.options.flatMap((option) => [
      ...LOCALES.map((item) => option.translations[item] ?? ""),
      ...option.values.flatMap((value) => LOCALES.map((item) => value.labels[item] ?? "")),
    ]);
    docs.push(prepareDoc<SiteResult>(
      {
        id: `product-${product.id}`,
        kind: "product",
        title: localized(product.translations, locale),
        subtitle: `${localized(product.category.translations, locale)} · ${productSubtitle[locale]}`,
        href: `/products/${product.slug}?lang=${locale}`,
        image: image ? assetUrl(image.url) : undefined,
      },
      [
        { text: localized(product.translations, locale), weight: 3 },
        ...otherTitles(product.translations, locale),
        { text: productKeywords[product.slug] ?? "", weight: 2.4 },
        { text: LOCALES.map((item) => product.category.translations[item] ?? "").join(" "), weight: 1.4 },
        { text: LOCALES.map((item) => product.descriptions[item] ?? "").join(" "), weight: 1 },
        { text: [...product.variants.flatMap((variant) => LOCALES.map((item) => variant.translations[item] ?? "")), ...optionWords].join(" "), weight: 1 },
      ],
    ));
  }

  for (const page of pages) {
    docs.push(prepareDoc<SiteResult>(
      { id: `page-${page.id}`, kind: "page", title: page.title[locale], subtitle: page.subtitle[locale], href: page.href(locale), external: page.external },
      [{ text: page.title[locale], weight: 3 }, ...otherTitles(page.title, locale), { text: page.keywords, weight: 2 }],
    ));
  }

  faqContent[locale].questions.forEach(([question, answer], index) => {
    docs.push(prepareDoc<SiteResult>(
      { id: `faq-${index}`, kind: "faq", title: question, subtitle: answer, href: `/faq?lang=${locale}#${faqAnchor(index)}` },
      [
        { text: question, weight: 2.6 },
        ...LOCALES.filter((other) => other !== locale).map((other) => ({ text: faqContent[other].questions[index][0], weight: 1.6 })),
        { text: answer, weight: 1 },
      ],
    ));
  });

  return docs;
}

/** Ranked results grouped by kind; groups are ordered by their best result. */
export function searchSite(index: PreparedDoc<SiteResult>[], query: string): { kind: SiteResultKind; results: SiteResult[] }[] {
  const hits = searchDocs(index, query, 80).map((hit) => ({ ...hit, score: hit.score + kindBoost[hit.item.kind] }));
  const groups = new Map<SiteResultKind, { best: number; results: SiteResult[] }>();
  for (const hit of hits.sort((left, right) => right.score - left.score)) {
    const group = groups.get(hit.item.kind) ?? { best: hit.score, results: [] };
    if (group.results.length < kindLimit[hit.item.kind]) group.results.push(hit.item);
    groups.set(hit.item.kind, group);
  }
  return [...groups.entries()]
    .sort((left, right) => right[1].best - left[1].best)
    .map(([kind, group]) => ({ kind, results: group.results }));
}
