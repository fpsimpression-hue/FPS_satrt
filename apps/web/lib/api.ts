export type Locale = "fr" | "ar" | "en";

export type Category = {
  id: string;
  slug: string;
  translations: Record<Locale, string>;
};

export type ProductOptionValue = {
  value: string;
  labels: Record<Locale, string>;
};

export type ProductOption = {
  id: string;
  code: string;
  translations: Record<Locale, string>;
  values: ProductOptionValue[];
  is_required: boolean;
};

export type ProductImage = {
  id: string;
  url: string;
  content_type: "image/jpeg" | "image/png" | "image/webp";
  size_bytes: number;
  alt_texts: Partial<Record<Locale, string>>;
  sort_order: number;
  is_primary: boolean;
};

export type ProductVariant = {
  id: string;
  sku: string;
  translations: Record<Locale, string>;
};

export type Product = {
  id: string;
  slug: string;
  translations: Record<Locale, string>;
  descriptions: Record<Locale, string>;
  category: Category;
  variants: ProductVariant[];
  options: ProductOption[];
  images: ProductImage[];
};

export type PriceCheck = {
  status: "priced" | "quote_required";
  total_price: string | null;
  currency: "TND";
};

export type UploadResult = {
  id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  review_status: "pending";
};

export type CustomerDetails = {
  full_name: string;
  phone: string;
  email?: string;
  locale: Locale;
  whatsapp_opt_in: boolean;
};

export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export function assetUrl(path: string): string {
  if (path.startsWith("/portfolio/")) return path;
  return `${apiBaseUrl}${path}`;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let result: { detail?: string } | null;
    try {
      result = (await response.json()) as { detail?: string };
    } catch {
      throw new Error(`La requête a échoué (HTTP ${response.status}).`);
    }
    throw new Error(result?.detail ?? `La requête a échoué (HTTP ${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  const language = new URLSearchParams(window.location.search).get("lang");
  return language === "ar" || language === "en" ? language : "fr";
}

export function localized(
  translations: Record<Locale, string>,
  locale: Locale,
): string {
  return translations[locale] || translations.fr;
}
