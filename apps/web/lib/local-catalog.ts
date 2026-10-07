import type { Category, Product } from "@/lib/api";

type LocalProduct = Omit<Product, "category"> & { categorySlug: string };

const categories: Category[] = [
  { id: "local-category-print", slug: "imprimes-papeterie", translations: { fr: "Imprimés & papeterie", ar: "مطبوعات وقرطاسية", en: "Print & stationery" } },
  { id: "local-category-signage", slug: "enseignes", translations: { fr: "Enseignes & signalétique", ar: "لافتات وإشارات", en: "Signs & signage" } },
  { id: "local-category-textile", slug: "textile", translations: { fr: "Textile personnalisé", ar: "منسوجات مخصصة", en: "Custom textiles" } },
  { id: "local-category-gifts", slug: "objets-cadeaux", translations: { fr: "Objets cadeaux", ar: "هدايا مخصصة", en: "Gift items" } },
  { id: "local-category-large", slug: "grand-format", translations: { fr: "Impression grand format", ar: "طباعة كبيرة الحجم", en: "Large format" } },
];

const localProducts: LocalProduct[] = [
  {
    id: "local-business-cards", slug: "cartes-de-visite", categorySlug: "imprimes-papeterie",
    translations: { fr: "Cartes de visite", ar: "بطاقات عمل", en: "Business cards" },
    descriptions: { fr: "Cartes professionnelles personnalisées.", ar: "بطاقات مهنية مخصصة.", en: "Custom professional cards." },
    variants: [], options: [],
    images: ["01.jpg", "02.jpg", "03.jpg"].map((fileName, index) => ({ id: `local-card-${fileName}`, url: `/portfolio/imprimes-papeterie/${fileName}`, content_type: "image/jpeg" as const, size_bytes: 1, alt_texts: { fr: "Carte de visite personnalisée" }, sort_order: index, is_primary: index === 0 })),
  },
  {
    id: "local-flyers", slug: "flyers", categorySlug: "imprimes-papeterie",
    translations: { fr: "Flyers & brochures", ar: "منشورات وكتيبات", en: "Flyers & brochures" },
    descriptions: { fr: "Supports imprimés pour vos événements.", ar: "مطبوعات لفعالياتكم.", en: "Printed material for your events." },
    variants: [], options: [],
    images: ["04.jpg", "05.jpg", "06.jpg"].map((fileName, index) => ({ id: `local-flyer-${fileName}`, url: `/portfolio/imprimes-papeterie/${fileName}`, content_type: "image/jpeg" as const, size_bytes: 1, alt_texts: { fr: "Flyer personnalisé" }, sort_order: index, is_primary: index === 0 })),
  },
  {
    id: "local-signage", slug: "enseignes", categorySlug: "enseignes",
    translations: { fr: "Enseignes", ar: "لافتات", en: "Signs" },
    descriptions: { fr: "Enseignes et signalétique sur mesure.", ar: "لافتات وإشارات حسب الطلب.", en: "Made-to-measure signs and signage." },
    variants: [], options: [],
    images: ["01.jpg", "02.jpg", "03.jpg"].map((fileName, index) => ({ id: `local-sign-${fileName}`, url: `/portfolio/enseignes/${fileName}`, content_type: "image/jpeg" as const, size_bytes: 1, alt_texts: { fr: "Enseigne personnalisée" }, sort_order: index, is_primary: index === 0 })),
  },
  {
    id: "local-textile", slug: "t-shirt-personnalise", categorySlug: "textile",
    translations: { fr: "Textile personnalisé", ar: "منسوجات مخصصة", en: "Custom textile" },
    descriptions: { fr: "Textiles imprimés à votre image.", ar: "منسوجات مطبوعة بتصميمكم.", en: "Textiles printed with your design." },
    variants: [], options: [],
    images: ["01.jpg", "02.jpg", "03.jpg"].map((fileName, index) => ({ id: `local-textile-${fileName}`, url: `/portfolio/textile/${fileName}`, content_type: "image/jpeg" as const, size_bytes: 1, alt_texts: { fr: "Textile personnalisé" }, sort_order: index, is_primary: index === 0 })),
  },
  {
    id: "local-gifts", slug: "objets-cadeaux", categorySlug: "objets-cadeaux",
    translations: { fr: "Objets cadeaux", ar: "هدايا مخصصة", en: "Gift items" },
    descriptions: { fr: "Objets personnalisés pour offrir.", ar: "هدايا مخصصة.", en: "Personalised gifts." },
    variants: [], options: [],
    images: ["01.jpg", "02.jpg", "03.jpg"].map((fileName, index) => ({ id: `local-gift-${fileName}`, url: `/portfolio/objets-cadeaux/${fileName}`, content_type: "image/jpeg" as const, size_bytes: 1, alt_texts: { fr: "Objet cadeau personnalisé" }, sort_order: index, is_primary: index === 0 })),
  },
  {
    id: "local-large-format", slug: "grand-format", categorySlug: "grand-format",
    translations: { fr: "Impression grand format", ar: "طباعة كبيرة الحجم", en: "Large format printing" },
    descriptions: { fr: "Bâches, affiches et supports grand format.", ar: "لافتات وملصقات كبيرة الحجم.", en: "Banners, posters and large-format media." },
    variants: [], options: [],
    images: ["01.jpg", "02.jpg", "03.jpg"].map((fileName, index) => ({ id: `local-large-${fileName}`, url: `/portfolio/grand-format/${fileName}`, content_type: "image/jpeg" as const, size_bytes: 1, alt_texts: { fr: "Impression grand format" }, sort_order: index, is_primary: index === 0 })),
  },
];

export const localCatalogueCategories = categories;

export const localCatalogueProducts: Product[] = localProducts.map(({ categorySlug, ...product }) => ({
  ...product,
  category: categories.find((category) => category.slug === categorySlug)!,
}));
