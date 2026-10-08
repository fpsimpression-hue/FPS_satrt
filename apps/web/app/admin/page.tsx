"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Brand } from "@/components/brand";
import {
  ApiError,
  apiBaseUrl,
  apiRequest,
  assetUrl,
  localized,
  type Product,
  type ProductImage,
} from "@/lib/api";
import { highlightParts, phoneDigits, prepareDoc, searchDocs, type PreparedDoc, type SearchField } from "@/lib/search";

type AdminUser = { username: string };
type Overview = {
  pending_quotes: number;
  quoted_requests: number;
  orders_to_review: number;
  orders_in_production: number;
  orders_ready: number;
  whatsapp_pending: number;
  whatsapp_failed: number;
};
type AdminNotification = {
  id: string;
  event_type: string;
  reference: string;
  status: "pending" | "processing" | "sent" | "failed";
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
};
type AdminFile = {
  id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  review_status: "pending" | "approved" | "rejected";
};
type Quote = {
  id: string;
  reference: string;
  status: "pending" | "quoted" | "accepted" | "declined";
  product_name: string;
  variant_name: string;
  project_category: string | null;
  quantity: number;
  selected_options: Record<string, string>;
  dimensions: string | null;
  desired_date: string | null;
  design_help: boolean;
  fulfillment_method: "pickup" | "delivery";
  delivery_address: string | null;
  notes: string | null;
  quoted_amount: string | null;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  files: AdminFile[];
};
type OrderItem = {
  product_name: string;
  variant_name: string;
  quantity: number;
  selected_options: Record<string, string>;
  line_total: string;
  files: AdminFile[];
};
type AdminOrder = {
  id: string;
  reference: string;
  status: "pending_review" | "confirmed" | "in_production" | "ready" | "completed" | "cancelled";
  fulfillment_method: "pickup" | "delivery";
  delivery_address: string | null;
  payment_method: "cash_on_fulfillment";
  total_amount: string;
  currency: "TND";
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  items: OrderItem[];
};
type PriceTier = {
  id: string;
  product_id: string;
  product_name: string;
  variant_id: string;
  variant_name: string;
  option_values: Record<string, string>;
  quantity_min: number;
  quantity_max: number;
  total_price: string;
  currency: "TND";
  is_active: boolean;
};
type Section = "board" | "prices" | "images" | "messages";
type Stage = "new" | "waiting" | "launch" | "production" | "ready" | "history";
type Job =
  | { kind: "quote"; stage: Stage; quote: Quote }
  | { kind: "order"; stage: Stage; order: AdminOrder };
type IconName = "phone" | "whatsapp" | "file" | "pin" | "upload" | "check" | "search";

const CUSTOM_PROJECT = "Projet sur mesure";
const ACCEPTED_FILES = ".pdf,.png,.jpg,.jpeg,.tif,.tiff,application/pdf,image/png,image/jpeg,image/tiff";

// The board follows the workshop's day: each stage says in plain words what to do next.
const STAGES: { id: Stage; label: string; todo: string; empty: string }[] = [
  { id: "new", label: "Nouvelles demandes", todo: "lisez la demande, appelez le client si besoin, puis envoyez-lui un prix.", empty: "Aucune nouvelle demande pour le moment." },
  { id: "waiting", label: "Réponse du client", todo: "le prix est envoyé. Dès que le client est d’accord, créez la commande.", empty: "Aucun client à relancer." },
  { id: "launch", label: "À lancer", todo: "ouvrez le fichier, vérifiez-le, puis lancez la production.", empty: "Aucune commande à lancer." },
  { id: "production", label: "En production", todo: "quand le travail est terminé, indiquez que la commande est prête.", empty: "Rien en production en ce moment." },
  { id: "ready", label: "À remettre", todo: "remettez la commande au client et encaissez le montant indiqué.", empty: "Aucune commande en attente de retrait." },
  { id: "history", label: "Historique", todo: "dossiers terminés, refusés ou annulés. Aucune action n’est nécessaire.", empty: "L’historique est vide." },
];

const HISTORY_LABELS: Record<string, string> = {
  declined: "Demande refusée",
  completed: "Remise au client",
  cancelled: "Commande annulée",
};

const notificationStatusLabels: Record<AdminNotification["status"], string> = {
  pending: "En attente d’envoi",
  processing: "Envoi en cours",
  sent: "Envoyé",
  failed: "Non envoyé",
};
const notificationLabels: Record<string, string> = {
  quote_received: "Accusé de réception de la demande",
  quote_prepared: "Prix envoyé au client",
  quote_declined: "Demande refusée",
  order_received: "Commande créée",
  order_confirmed: "Commande confirmée",
  order_in_production: "Production lancée",
  order_ready: "Commande prête",
  order_completed: "Commande remise",
  order_cancelled: "Commande annulée",
};

// Server messages translated for the team; anything unknown falls back to a plain sentence.
const API_MESSAGES: Record<string, string> = {
  "Invalid username or password": "Identifiant ou mot de passe incorrect.",
  "Too many login attempts. Try again later.": "Trop de tentatives. Patientez 15 minutes avant de réessayer.",
  "Administrator access is not configured": "L’accès équipe n’est pas encore configuré sur le serveur.",
  "Request origin is not allowed": "Action refusée : ouvrez l’espace équipe depuis l’adresse habituelle du site.",
  "A print-ready file must be attached before creating an order": "Ajoutez d’abord le fichier à imprimer.",
  "Only a priced quote can be converted into an order": "Envoyez d’abord un prix au client.",
  "The quoted product is no longer available": "Ce produit n’est plus proposé dans le catalogue.",
  "This quote request is closed": "Cette demande est déjà clôturée.",
  "This quote request can no longer be updated": "Cette demande ne peut plus être modifiée.",
  "A confirmed total in TND is required before marking the quote as ready": "Indiquez le prix total en TND.",
  "Attach a print-ready file before starting production": "Ajoutez le fichier à imprimer avant de lancer la production.",
  "Production can only start for an order awaiting launch": "Cette commande est déjà lancée ou terminée. Actualisez la page.",
  "Files can only be added before production starts": "La production est lancée : les fichiers ne peuvent plus être modifiés.",
  "Only failed notifications can be retried": "Ce message n’est pas en échec.",
  "This quantity range overlaps an active price for the same options": "Un tarif existe déjà pour ces quantités et ces options. Désactivez-le d’abord.",
  "Active product variant not found": "Produit ou format introuvable.",
  "Product not found": "Produit introuvable.",
};

function friendlyError(cause: unknown, fallback: string): string {
  if (!(cause instanceof ApiError)) return "Connexion impossible. Vérifiez internet puis réessayez.";
  if (API_MESSAGES[cause.message]) return API_MESSAGES[cause.message];
  if (cause.message.startsWith("Cannot move an order")) return "Cette action n’est plus possible pour cette commande. Actualisez la page.";
  if (cause.status === 401) return "Votre session a expiré. Reconnectez-vous.";
  if (cause.status === 413) return "Fichier trop lourd.";
  if (cause.status === 415) return "Format non accepté : utilisez PDF, PNG, JPEG ou TIFF (ou JPG, PNG, WebP pour les photos).";
  if (cause.status === 422) return "Une information saisie est invalide. Vérifiez puis réessayez.";
  if (cause.status >= 500) return "Le serveur ne répond pas correctement. Réessayez dans un instant.";
  return fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", hourCycle: "h23" }).format(new Date(value));
}

function formatDay(isoDate: string) {
  return new Intl.DateTimeFormat("fr-TN", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${isoDate}T12:00:00`));
}

function timeAgo(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  const relative = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  if (minutes < 1) return "à l’instant";
  if (minutes < 60) return relative.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return relative.format(-hours, "hour");
  const days = Math.round(hours / 24);
  return days < 7 ? relative.format(-days, "day") : formatDate(value);
}

function formatMoney(value: string | number) {
  const amount = new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Number(value));
  return `${amount} TND`;
}

/** Accepts "450", "450,5" or "1 250.750" and returns an API-ready amount, or null when invalid. */
function parseAmount(input: string): string | null {
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  if (!/^\d{1,9}(\.\d{1,3})?$/.test(normalized) || Number(normalized) <= 0) return null;
  return normalized;
}

function whatsappHref(phone: string) {
  let digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.length === 8) digits = `216${digits}`;
  return `https://wa.me/${digits}`;
}

function daysUntil(isoDate: string) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((new Date(`${isoDate}T12:00:00`).getTime() - today.getTime()) / 86_400_000);
}

function quoteStage(quote: Quote): Stage | null {
  if (quote.status === "pending") return "new";
  if (quote.status === "quoted") return "waiting";
  // Accepted quotes continue as orders, so only refused ones stay in the history.
  return quote.status === "declined" ? "history" : null;
}

function orderStage(order: AdminOrder): Stage {
  if (order.status === "pending_review" || order.status === "confirmed") return "launch";
  if (order.status === "in_production") return "production";
  if (order.status === "ready") return "ready";
  return "history";
}

function jobCustomer(job: Job) {
  const record = job.kind === "quote" ? job.quote : job.order;
  return { name: record.customer_name, phone: record.customer_phone, email: record.customer_email };
}

function jobCreatedAt(job: Job) {
  return job.kind === "quote" ? job.quote.created_at : job.order.created_at;
}

/** What the team can search in a file, the most telling fields weighing most. */
function jobFields(job: Job): SearchField[] {
  if (job.kind === "quote") {
    const quote = job.quote;
    return [
      { text: quote.customer_name, weight: 3 },
      { text: quote.reference, weight: 2.6 },
      { text: quote.product_name, weight: 2 },
      { text: quote.customer_email ?? "", weight: 1.6 },
      { text: [quote.variant_name, quote.dimensions ?? "", ...Object.values(quote.selected_options)].join(" "), weight: 1.2 },
      { text: [quote.notes ?? "", quote.delivery_address ?? ""].join(" "), weight: 1 },
    ];
  }
  const order = job.order;
  return [
    { text: order.customer_name, weight: 3 },
    { text: order.reference, weight: 2.6 },
    { text: order.items.map((item) => item.product_name).join(" "), weight: 2 },
    { text: order.customer_email ?? "", weight: 1.6 },
    { text: order.items.flatMap((item) => [item.variant_name, ...Object.values(item.selected_options)]).join(" "), weight: 1.2 },
    { text: order.delivery_address ?? "", weight: 1 },
  ];
}

/** Ranked files for a query; phone numbers match whatever way they are typed. */
function searchJobs(prepared: PreparedDoc<Job>[], query: string): Job[] {
  const scores = new Map<Job, number>();
  const digits = phoneDigits(query);
  if (digits.length >= 3 && /^[\d\s+().-]+$/.test(query)) {
    for (const doc of prepared) {
      const phone = phoneDigits(jobCustomer(doc.item).phone);
      if (phone.includes(digits)) scores.set(doc.item, phone.startsWith(digits) ? 11 : 10);
    }
  }
  for (const hit of searchDocs(prepared, query, 200)) {
    scores.set(hit.item, Math.max(scores.get(hit.item) ?? 0, hit.score));
  }
  return [...scores.entries()].sort((left, right) => right[1] - left[1]).map(([job]) => job);
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    phone: <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.56 1 1 0 0 1-.25 1Z" />,
    whatsapp: <><path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.45L3.5 20.5l1.45-4.3A8.5 8.5 0 1 1 20.5 11.6Z" /><path d="M9.2 8.4c.3-.6.6-.6.9-.6h.6c.2 0 .4.1.5.4l.8 1.9c.1.3 0 .5-.1.7l-.6.7c-.2.2-.2.4-.1.6a7.7 7.7 0 0 0 3.4 3c.2.1.4.1.6-.1l.8-.9c.2-.2.4-.3.7-.2l1.8.9" /></>,
    file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    upload: <><path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></>,
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  };
  return (
    <svg aria-hidden="true" className="desk-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [section, setSection] = useState<Section>("board");
  const [stage, setStage] = useState<Stage | null>(null);
  const [query, setQuery] = useState("");
  const [searchStage, setSearchStage] = useState<Stage | "all">("all");
  const searchRef = useRef<HTMLInputElement>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [tiers, setTiers] = useState<PriceTier[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [optionValues, setOptionValues] = useState<Record<string, string>>({});
  const [quantityMin, setQuantityMin] = useState("1");
  const [quantityMax, setQuantityMax] = useState("100");
  const [totalPrice, setTotalPrice] = useState("");
  const [imageAltTexts, setImageAltTexts] = useState({ fr: "", ar: "", en: "" });
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [editingPrice, setEditingPrice] = useState<Record<string, boolean>>({});
  const [filesChecked, setFilesChecked] = useState<Record<string, boolean>>({});
  const [confirming, setConfirming] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; stage?: Stage } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const activeLocale = "fr" as const;

  const loadWorkspace = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [dashboard, quoteList, orderList, priceList, productList, notificationList] = await Promise.all([
        apiRequest<Overview>("/admin/overview"),
        apiRequest<Quote[]>("/admin/quotes"),
        apiRequest<AdminOrder[]>("/admin/orders"),
        apiRequest<PriceTier[]>("/admin/prices"),
        apiRequest<Product[]>("/catalog/products"),
        apiRequest<AdminNotification[]>("/admin/notifications"),
      ]);
      setOverview(dashboard);
      setQuotes(quoteList);
      setOrders(orderList);
      setTiers(priceList);
      setProducts(productList);
      setNotifications(notificationList);
      setLastUpdated(new Date());
      if (!selectedProductId && productList.length) {
        const firstProduct = productList[0];
        setSelectedProductId(firstProduct.id);
        setSelectedVariantId(firstProduct.variants[0]?.id ?? "");
        setOptionValues(Object.fromEntries(firstProduct.options.map((option) => [option.code, option.values[0]?.value ?? ""])));
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setUser(null);
        setError("Votre session a expiré. Reconnectez-vous.");
      } else {
        setError(friendlyError(cause, "Les informations de l’atelier n’ont pas pu être chargées."));
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProductId, user]);

  useEffect(() => {
    let active = true;
    apiRequest<AdminUser>("/admin/auth/me")
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((cause: unknown) => {
        // Not being signed in yet is the normal case, not an error to show.
        if (active && !(cause instanceof ApiError && cause.status === 401)) setError(friendlyError(cause, "Connexion impossible."));
      })
      .finally(() => {
        if (active) setSessionChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user) void loadWorkspace();
  }, [loadWorkspace, user]);

  // "/" puts the cursor in the search field, as on the public site.
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target;
      const typing = target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (event.key === "/" && !typing && searchRef.current) {
        event.preventDefault();
        searchRef.current.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadWorkspace();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [loadWorkspace, user]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginBusy(true);
    setError("");
    try {
      const currentUser = await apiRequest<AdminUser>("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setPassword("");
      setUser(currentUser);
    } catch (cause) {
      setError(friendlyError(cause, "Connexion impossible."));
    } finally {
      setLoginBusy(false);
    }
  }

  async function logout() {
    setError("");
    try {
      await apiRequest<void>("/admin/auth/logout", { method: "POST" });
      setUser(null);
      setOverview(null);
      setNotice(null);
    } catch (cause) {
      setError(friendlyError(cause, "La déconnexion a échoué."));
    }
  }

  /** Runs one team action, shows a plain-language result and refreshes the board. */
  async function run(key: string, action: () => Promise<unknown>, success: { text: string; stage?: Stage }, fallback: string) {
    setBusyKey(key);
    setError("");
    setNotice(null);
    setConfirming(null);
    try {
      await action();
      setNotice(success);
      await loadWorkspace();
      return true;
    } catch (cause) {
      setError(friendlyError(cause, fallback));
      return false;
    } finally {
      setBusyKey("");
    }
  }

  async function sendPrice(quote: Quote) {
    const amount = parseAmount(amounts[quote.id] ?? quote.quoted_amount ?? "");
    if (!amount) {
      setError("Indiquez un prix valide, par exemple 450 ou 450,500.");
      return;
    }
    const resent = quote.status === "quoted";
    const done = await run(
      quote.id,
      () => apiRequest(`/admin/quotes/${quote.id}`, { method: "PATCH", body: JSON.stringify({ status: "quoted", quoted_amount: amount }) }),
      {
        text: resent
          ? `Nouveau prix enregistré pour ${quote.customer_name} : ${formatMoney(amount)}.`
          : `Prix de ${formatMoney(amount)} envoyé à ${quote.customer_name}. Le dossier attend maintenant sa réponse.`,
        stage: "waiting",
      },
      "Le prix n’a pas pu être enregistré.",
    );
    if (done) setEditingPrice((current) => ({ ...current, [quote.id]: false }));
  }

  function declineQuote(quote: Quote) {
    void run(
      quote.id,
      () => apiRequest(`/admin/quotes/${quote.id}`, { method: "PATCH", body: JSON.stringify({ status: "declined", quoted_amount: null }) }),
      { text: `La demande de ${quote.customer_name} est refusée et rangée dans l’historique.` },
      "La demande n’a pas pu être refusée.",
    );
  }

  function acceptQuote(quote: Quote) {
    void run(
      quote.id,
      () => apiRequest(`/admin/quotes/${quote.id}/convert-to-order`, { method: "POST" }),
      { text: `Commande créée pour ${quote.customer_name}. Elle vous attend dans « À lancer ».`, stage: "launch" },
      "La commande n’a pas pu être créée.",
    );
  }

  function uploadFile(key: string, path: string, file: File | undefined, owner: string) {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    void run(
      key,
      () => apiRequest(path, { method: "POST", body }),
      { text: `Fichier « ${file.name} » ajouté au dossier de ${owner}.` },
      "Le fichier n’a pas pu être ajouté.",
    );
  }

  function startProduction(order: AdminOrder) {
    void run(
      order.id,
      () => apiRequest(`/admin/orders/${order.id}/start-production`, { method: "POST" }),
      { text: `Production lancée pour ${order.customer_name}.`, stage: "production" },
      "La production n’a pas pu être lancée.",
    );
  }

  function moveOrder(order: AdminOrder, status: "ready" | "completed" | "cancelled") {
    const texts = {
      ready: { text: `La commande de ${order.customer_name} est prête. Elle attend maintenant d’être remise.`, stage: "ready" as Stage },
      completed: { text: `Commande de ${order.customer_name} remise et payée. Bravo !` },
      cancelled: { text: `La commande de ${order.customer_name} est annulée.` },
    };
    void run(
      order.id,
      () => apiRequest(`/admin/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
      texts[status],
      "La commande n’a pas pu être mise à jour.",
    );
  }

  function selectProduct(productId: string) {
    const nextProduct = products.find((product) => product.id === productId);
    setSelectedProductId(productId);
    setImageAltTexts({ fr: "", ar: "", en: "" });
    setSelectedVariantId(nextProduct?.variants[0]?.id ?? "");
    setOptionValues(Object.fromEntries((nextProduct?.options ?? []).map((option) => [option.code, option.values[0]?.value ?? ""])));
  }

  async function createPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;
    const price = parseAmount(totalPrice);
    if (!price) {
      setError("Indiquez un prix valide, par exemple 45 ou 45,500.");
      return;
    }
    const done = await run(
      "prices",
      () => apiRequest<PriceTier>("/admin/prices", {
        method: "POST",
        body: JSON.stringify({
          product_id: selectedProduct.id,
          variant_id: selectedVariantId,
          option_values: optionValues,
          quantity_min: Number(quantityMin),
          quantity_max: Number(quantityMax),
          total_price: price,
        }),
      }),
      { text: "Le tarif est publié : les clients voient désormais ce prix sur le site." },
      "Le tarif n’a pas pu être publié.",
    );
    if (done) setTotalPrice("");
  }

  function deactivatePrice(tier: PriceTier) {
    void run(
      tier.id,
      () => apiRequest<void>(`/admin/prices/${tier.id}`, { method: "DELETE" }),
      { text: "Le tarif est retiré : les clients feront une demande de devis pour cette combinaison." },
      "Le tarif n’a pas pu être retiré.",
    );
  }

  function retryNotification(notification: AdminNotification) {
    void run(
      notification.id,
      () => apiRequest<AdminNotification>(`/admin/notifications/${notification.id}/retry`, { method: "POST" }),
      { text: `Le message pour ${notification.reference} va être renvoyé.` },
      "Le message n’a pas pu être relancé.",
    );
  }

  async function uploadProductImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("product_image");
    if (!(fileInput instanceof HTMLInputElement) || !fileInput.files?.[0]) return;
    const body = new FormData();
    body.append("image", fileInput.files[0]);
    body.append("alt_fr", imageAltTexts.fr);
    body.append("alt_ar", imageAltTexts.ar);
    body.append("alt_en", imageAltTexts.en);
    body.append("is_primary", String(selectedProduct.images.length === 0));
    const done = await run(
      "images",
      () => apiRequest<ProductImage>(`/admin/products/${selectedProduct.id}/images`, { method: "POST", body }),
      { text: "La photo est ajoutée à la fiche du produit." },
      "La photo n’a pas pu être ajoutée.",
    );
    if (done) {
      form.reset();
      setImageAltTexts({ fr: "", ar: "", en: "" });
    }
  }

  function updateProductImage(image: ProductImage) {
    if (!selectedProduct) return;
    void run(
      image.id,
      () => apiRequest<ProductImage>(`/admin/products/${selectedProduct.id}/images/${image.id}`, { method: "PATCH", body: JSON.stringify({ is_primary: true }) }),
      { text: "Cette photo est maintenant la photo principale du produit." },
      "La photo n’a pas pu être modifiée.",
    );
  }

  function deleteProductImage(image: ProductImage) {
    if (!selectedProduct) return;
    void run(
      image.id,
      () => apiRequest<void>(`/admin/products/${selectedProduct.id}/images/${image.id}`, { method: "DELETE" }),
      { text: "La photo est supprimée de la fiche du produit." },
      "La photo n’a pas pu être supprimée.",
    );
  }

  /** Translates option codes such as "paper: mat" into the catalogue labels the team knows. */
  function describeOptions(options: Record<string, string>) {
    return Object.entries(options).map(([code, value]) => {
      const option = products.flatMap((product) => product.options).find((item) => item.code === code);
      const label = option ? localized(option.translations, activeLocale) : code;
      const choice = option?.values.find((item) => item.value === value);
      return { label, value: choice ? localized(choice.labels, activeLocale) : value };
    });
  }

  /** Destructive actions ask for a second click with a plain question. */
  function confirmable(key: string, label: string, question: string, onConfirm: () => void) {
    if (confirming === key) {
      return (
        <div className="desk-confirm" role="group" aria-label={question}>
          <span>{question}</span>
          <button className="desk-danger" onClick={onConfirm} type="button">Oui, confirmer</button>
          <button className="desk-link" onClick={() => setConfirming(null)} type="button">Non, garder</button>
        </div>
      );
    }
    return <button className="desk-secondary" onClick={() => setConfirming(key)} type="button">{label}</button>;
  }

  function fileList(files: AdminFile[], upload?: { key: string; path: string; owner: string }) {
    return (
      <div className="desk-files">
        {files.map((file) => (
          <a className="desk-file" href={`${apiBaseUrl}/api/v1/admin/files/${file.id}/download`} key={file.id} rel="noreferrer" target="_blank">
            <Icon name="file" />{file.original_filename}<small>Ouvrir</small>
          </a>
        ))}
        {upload && (
          <label className={busyKey === upload.key ? "desk-upload is-busy" : "desk-upload"}>
            <Icon name="upload" />
            {files.length ? "Ajouter un autre fichier" : "Ajouter le fichier à imprimer"}
            <input accept={ACCEPTED_FILES} disabled={busyKey === upload.key} onChange={(event) => { uploadFile(upload.key, upload.path, event.target.files?.[0], upload.owner); event.currentTarget.value = ""; }} type="file" />
          </label>
        )}
        {!upload && files.length === 0 && <span className="desk-muted">Aucun fichier joint</span>}
      </div>
    );
  }

  function priceField(quote: Quote, label: string) {
    const value = amounts[quote.id] ?? quote.quoted_amount ?? "";
    return (
      <label className="desk-money">
        <span>{label}</span>
        <span className="desk-money-field">
          <input
            aria-label={`${label} pour ${quote.customer_name}`}
            inputMode="decimal"
            onChange={(event) => setAmounts((current) => ({ ...current, [quote.id]: event.target.value }))}
            onKeyDown={(event) => { if (event.key === "Enter") void sendPrice(quote); }}
            placeholder="Ex. 450"
            value={value}
          />
          <b>TND</b>
        </span>
      </label>
    );
  }

  function highlighted(value: string) {
    if (!trimmedQuery) return value;
    return highlightParts(value, trimmedQuery).map((part, index) => (part.match ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>));
  }

  function renderJob(job: Job, showStage = false) {
    const customer = jobCustomer(job);
    const key = job.kind === "quote" ? job.quote.id : job.order.id;
    const reference = job.kind === "quote" ? job.quote.reference : job.order.reference;
    const busy = busyKey === key;
    const stageIndex = STAGES.findIndex((item) => item.id === job.stage);

    const header = (
      <header className="desk-card-head">
        <div>
          {showStage && (
            <button className={`desk-stage-badge is-${job.stage}`} onClick={() => setSearchStage(job.stage)} type="button">
              {job.stage === "history" ? "Historique" : `Étape ${stageIndex + 1} · ${STAGES[stageIndex].label}`}
            </button>
          )}
          <h3>{highlighted(customer.name)}</h3>
          <p>{timeAgo(jobCreatedAt(job))} · <span className="desk-ref">Réf. {highlighted(reference)}</span></p>
        </div>
        <div className="desk-contact">
          <a className="desk-chip" href={`tel:${customer.phone.replace(/\s/g, "")}`}><Icon name="phone" /><span dir="ltr">{customer.phone}</span></a>
          <a className="desk-chip desk-chip-whatsapp" href={whatsappHref(customer.phone)} rel="noreferrer" target="_blank"><Icon name="whatsapp" />WhatsApp</a>
          {customer.email && <a className="desk-chip" href={`mailto:${customer.email}`}>{customer.email}</a>}
        </div>
      </header>
    );

    if (job.kind === "quote") {
      const quote = job.quote;
      const urgentIn = quote.desired_date ? daysUntil(quote.desired_date) : null;
      const isCustom = quote.variant_name === CUSTOM_PROJECT;
      return (
        <article className={busy ? "desk-card is-busy" : "desk-card"} key={key}>
          {header}
          <div className="desk-what">
            <p className="desk-product">{quote.product_name}{!isCustom && <span> · {quote.variant_name}</span>}</p>
            <ul className="desk-facts">
              <li><span>Quantité</span><b>{quote.quantity.toLocaleString("fr-TN")}</b></li>
              {describeOptions(quote.selected_options).map((option) => <li key={option.label}><span>{option.label}</span><b>{option.value}</b></li>)}
              {quote.dimensions && <li><span>Format</span><b>{quote.dimensions}</b></li>}
              {quote.desired_date && (
                <li className={urgentIn !== null && urgentIn <= 3 ? "is-urgent" : undefined}>
                  <span>Souhaité pour</span><b>{formatDay(quote.desired_date)}{urgentIn !== null && urgentIn <= 3 ? " · urgent" : ""}</b>
                </li>
              )}
              <li><span>Réception</span><b>{quote.fulfillment_method === "delivery" ? "Livraison" : "Retrait à l’atelier"}</b></li>
            </ul>
            {quote.design_help && <p className="desk-flag">Le client a besoin d’aide pour créer son visuel.</p>}
            {quote.notes && <blockquote className="desk-notes">{quote.notes}</blockquote>}
            {quote.delivery_address && <p className="desk-address"><Icon name="pin" />{quote.delivery_address}</p>}
          </div>
          {fileList(quote.files, job.stage === "history" ? undefined : { key, path: `/admin/quotes/${quote.id}/files`, owner: quote.customer_name })}

          {job.stage === "new" && (
            <footer className="desk-step">
              <div className="desk-actions">
                {priceField(quote, "Prix total à proposer")}
                <button className="desk-primary" disabled={busy || !parseAmount(amounts[quote.id] ?? "")} onClick={() => void sendPrice(quote)} type="button">
                  Envoyer le prix au client
                </button>
              </div>
              <p className="desk-help">Ensuite, appelez le client pour lui présenter l’offre. S’il a choisi WhatsApp, il reçoit aussi le prix automatiquement.</p>
              <div className="desk-secondary-row">
                {confirmable(`${key}:decline`, "Refuser la demande", "Refuser définitivement cette demande ?", () => declineQuote(quote))}
              </div>
            </footer>
          )}

          {job.stage === "waiting" && (
            <footer className="desk-step">
              {editingPrice[quote.id] ? (
                <div className="desk-actions">
                  {priceField(quote, "Nouveau prix total")}
                  <button className="desk-primary" disabled={busy || !parseAmount(amounts[quote.id] ?? quote.quoted_amount ?? "")} onClick={() => void sendPrice(quote)} type="button">Enregistrer le nouveau prix</button>
                  <button className="desk-link" onClick={() => setEditingPrice((current) => ({ ...current, [quote.id]: false }))} type="button">Annuler</button>
                </div>
              ) : (
                <div className="desk-offer">
                  <span>Prix envoyé</span>
                  <b>{quote.quoted_amount ? formatMoney(quote.quoted_amount) : "—"}</b>
                  <button className="desk-link" onClick={() => setEditingPrice((current) => ({ ...current, [quote.id]: true }))} type="button">Modifier le prix</button>
                </div>
              )}
              {quote.files.length === 0 && (
                <p className="desk-warning">Pour créer la commande, ajoutez d’abord le fichier à imprimer : celui du client ou la maquette préparée par l’atelier.</p>
              )}
              <div className="desk-actions">
                <button className="desk-primary" disabled={busy || quote.files.length === 0} onClick={() => acceptQuote(quote)} type="button">
                  <Icon name="check" />Le client accepte : créer la commande
                </button>
              </div>
              <div className="desk-secondary-row">
                {confirmable(`${key}:refused`, "Le client refuse", "Le client refuse l’offre ? La demande ira dans l’historique.", () => declineQuote(quote))}
              </div>
            </footer>
          )}

          {job.stage === "history" && <p className="desk-history-status">{HISTORY_LABELS[quote.status]}</p>}
        </article>
      );
    }

    const order = job.order;
    const orderFiles = order.items.flatMap((item) => item.files);
    const checked = Boolean(filesChecked[order.id]);
    return (
      <article className={busy ? "desk-card is-busy" : "desk-card"} key={key}>
        {header}
        <div className="desk-what">
          {order.items.map((item, index) => (
            <div key={`${order.id}-${index}`}>
              <p className="desk-product">{item.product_name}{item.variant_name !== CUSTOM_PROJECT && <span> · {item.variant_name}</span>}</p>
              <ul className="desk-facts">
                <li><span>Quantité</span><b>{item.quantity.toLocaleString("fr-TN")}</b></li>
                {describeOptions(item.selected_options).map((option) => <li key={option.label}><span>{option.label}</span><b>{option.value}</b></li>)}
                <li><span>Réception</span><b>{order.fulfillment_method === "delivery" ? "Livraison" : "Retrait à l’atelier"}</b></li>
              </ul>
            </div>
          ))}
          {order.delivery_address && <p className="desk-address"><Icon name="pin" />{order.delivery_address}</p>}
        </div>
        {fileList(orderFiles, job.stage === "launch" ? { key, path: `/admin/orders/${order.id}/files`, owner: order.customer_name } : undefined)}

        {job.stage === "launch" && (
          <footer className="desk-step">
            <div className="desk-offer"><span>Montant de la commande</span><b>{formatMoney(order.total_amount)}</b></div>
            {orderFiles.length === 0 ? (
              <p className="desk-warning">Ajoutez le fichier à imprimer pour pouvoir lancer la production.</p>
            ) : (
              <label className="desk-check">
                <input checked={checked} onChange={(event) => setFilesChecked((current) => ({ ...current, [order.id]: event.target.checked }))} type="checkbox" />
                <span>J’ai ouvert et vérifié le fichier : textes, couleurs et dimensions sont corrects.</span>
              </label>
            )}
            <div className="desk-actions">
              <button className="desk-primary" disabled={busy || orderFiles.length === 0 || !checked} onClick={() => startProduction(order)} type="button">Lancer la production</button>
            </div>
            <div className="desk-secondary-row">
              {confirmable(`${key}:cancel`, "Annuler la commande", "Annuler cette commande ? Le client sera prévenu s’il a choisi WhatsApp.", () => moveOrder(order, "cancelled"))}
            </div>
          </footer>
        )}

        {job.stage === "production" && (
          <footer className="desk-step">
            <div className="desk-actions">
              <button className="desk-primary" disabled={busy} onClick={() => moveOrder(order, "ready")} type="button">La commande est prête</button>
            </div>
            <p className="desk-help">
              {order.fulfillment_method === "delivery" ? "Préparez ensuite la livraison à l’adresse indiquée." : "S’il a choisi WhatsApp, le client est prévenu qu’il peut venir la récupérer."}
            </p>
            <div className="desk-secondary-row">
              {confirmable(`${key}:cancel`, "Annuler la commande", "Annuler cette commande en cours de production ?", () => moveOrder(order, "cancelled"))}
            </div>
          </footer>
        )}

        {job.stage === "ready" && (
          <footer className="desk-step">
            <div className="desk-cash"><span>À encaisser</span><b>{formatMoney(order.total_amount)}</b></div>
            <div className="desk-actions">
              <button className="desk-primary" disabled={busy} onClick={() => moveOrder(order, "completed")} type="button">
                <Icon name="check" />Remise au client et payée
              </button>
            </div>
          </footer>
        )}

        {job.stage === "history" && (
          <p className="desk-history-status">{HISTORY_LABELS[order.status]} · {formatMoney(order.total_amount)}</p>
        )}
      </article>
    );
  }

  const jobs = useMemo<Job[]>(() => [
    ...quotes.flatMap((quote): Job[] => {
      const quoteJobStage = quoteStage(quote);
      return quoteJobStage ? [{ kind: "quote", stage: quoteJobStage, quote }] : [];
    }),
    ...orders.map((order): Job => ({ kind: "order", stage: orderStage(order), order })),
  ], [quotes, orders]);
  const preparedJobs = useMemo(() => jobs.map((job) => prepareDoc(job, jobFields(job))), [jobs]);
  const trimmedQuery = query.trim();
  const matchedJobs = useMemo(() => (trimmedQuery ? searchJobs(preparedJobs, trimmedQuery) : jobs), [jobs, preparedJobs, trimmedQuery]);

  if (!sessionChecked) {
    return <main className="admin-loading">Vérification de la connexion…</main>;
  }

  if (!user) {
    return (
      <main className="admin-login-page">
        <Brand href="/" />
        <form className="admin-login-card" onSubmit={login}>
          <p className="eyebrow"><span />ESPACE ÉQUIPE</p>
          <h1>Bonjour !</h1>
          <p>Connectez-vous pour suivre les demandes et les commandes de l’atelier.</p>
          <label className="form-field">
            <span>Identifiant</span>
            <input autoComplete="username" maxLength={80} onChange={(event) => setUsername(event.target.value)} required value={username} />
          </label>
          <label className="form-field">
            <span>Mot de passe</span>
            <input autoComplete="current-password" maxLength={256} minLength={12} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark" disabled={loginBusy} type="submit">
            {loginBusy ? "Connexion…" : "Se connecter"}<span aria-hidden="true">↗</span>
          </button>
          <Link className="admin-back-link" href="/">← Retour au site</Link>
        </form>
      </main>
    );
  }

  const searching = trimmedQuery.length > 0;
  const countByStage = (list: Job[]) => Object.fromEntries(STAGES.map((item) => [item.id, list.filter((job) => job.stage === item.id).length])) as Record<Stage, number>;
  const allCounts = countByStage(jobs);
  const counts = searching ? countByStage(matchedJobs) : allCounts;
  const activeStage = stage ?? STAGES.find((item) => item.id !== "history" && allCounts[item.id] > 0)?.id ?? "new";
  const activeStageInfo = STAGES.find((item) => item.id === activeStage) ?? STAGES[0];
  const urgency = (job: Job) => (job.kind === "quote" && job.quote.desired_date ? daysUntil(job.quote.desired_date) : 999);
  // While searching, results come from every stage in order of relevance; a stage tab narrows them.
  const stageJobs = searching
    ? matchedJobs.filter((job) => searchStage === "all" || job.stage === searchStage).slice(0, 60)
    : jobs
      .filter((job) => job.stage === activeStage)
      .sort((left, right) =>
        activeStage === "history"
          ? jobCreatedAt(right).localeCompare(jobCreatedAt(left))
          : urgency(left) - urgency(right) || jobCreatedAt(left).localeCompare(jobCreatedAt(right)),
      )
      .slice(0, activeStage === "history" ? 60 : undefined);
  const searchStageLabel = searchStage === "all" ? "" : STAGES.find((item) => item.id === searchStage)?.label ?? "";
  const actionCount = allCounts.new + allCounts.waiting + allCounts.launch + allCounts.production + allCounts.ready;
  const failedMessages = overview?.whatsapp_failed ?? 0;

  const navItems: { id: Section; label: string; group?: string; badge?: number }[] = [
    { id: "board", label: "Suivi des commandes", group: "ATELIER", badge: actionCount },
    { id: "prices", label: "Tarifs du catalogue", group: "CATALOGUE" },
    { id: "images", label: "Photos des produits" },
    { id: "messages", label: "Messages WhatsApp", group: "RÉGLAGES", badge: failedMessages },
  ];
  const titles: Record<Section, [string, string]> = {
    board: ["Suivi des commandes", "Chaque dossier avance d’étape en étape. Le bouton orange indique toujours la prochaine action."],
    prices: ["Tarifs du catalogue", "Un tarif publié s’affiche directement aux clients sur la fiche produit."],
    images: ["Photos des produits", "Les photos apparaissent dans le catalogue et sur la fiche de chaque produit."],
    messages: ["Messages WhatsApp", "Messages envoyés automatiquement aux clients qui ont accepté WhatsApp."],
  };

  return (
    <main className="admin-app">
      <header className="admin-header">
        <Brand href="/" />
        <div className="admin-header-right">
          <span>Connecté : {user.username}</span>
          <Link className="admin-logout admin-site-link" href="/" target="_blank">Voir le site</Link>
          <button className="admin-logout" onClick={() => void logout()} type="button">Se déconnecter</button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          {navItems.map((item) => (
            <div className="admin-nav-group" key={item.id}>
              {item.group && <p className="admin-sidebar-label">{item.group}</p>}
              <button
                aria-current={section === item.id ? "page" : undefined}
                className={section === item.id ? "admin-nav-item active" : "admin-nav-item"}
                onClick={() => { setSection(item.id); setError(""); setNotice(null); }}
                type="button"
              >
                {item.label}
                {item.badge ? <b>{item.badge}</b> : null}
              </button>
            </div>
          ))}
        </aside>

        <section className="admin-main">
          <div className="admin-page-title">
            <div>
              <h1>{titles[section][0]}</h1>
              <p className="desk-subtitle">{titles[section][1]}</p>
            </div>
            <div className="desk-refresh">
              {lastUpdated && <span>Mis à jour à {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}</span>}
              <button className="admin-refresh" disabled={loading} onClick={() => void loadWorkspace()} type="button">
                {loading ? "Actualisation…" : "↻ Actualiser"}
              </button>
            </div>
          </div>

          {error && <p className="admin-alert error" role="alert">{error}</p>}
          {notice && (
            <p className="admin-alert success" role="status">
              {notice.text}
              {notice.stage && section === "board" && notice.stage !== activeStage && (
                <button className="desk-link" onClick={() => { setStage(notice.stage ?? null); setNotice(null); }} type="button">Voir</button>
              )}
            </p>
          )}

          {section === "board" && (
            <>
              {failedMessages > 0 && (
                <p className="desk-banner">
                  {failedMessages} message(s) WhatsApp n’ont pas pu être envoyés. Prévenez ces clients par téléphone.
                  <button className="desk-link" onClick={() => setSection("messages")} type="button">Voir les messages</button>
                </p>
              )}
              <nav className="desk-stages" aria-label="Étapes du suivi">
                {STAGES.map((item, index) => {
                  const selected = searching ? searchStage === item.id : activeStage === item.id;
                  return (
                    <button
                      aria-current={selected ? "step" : undefined}
                      className={`desk-stage${selected ? " is-active" : ""}${item.id === "history" ? " is-history" : ""}${counts[item.id] === 0 ? " is-empty" : ""}`}
                      key={item.id}
                      onClick={() => {
                        if (searching) setSearchStage(item.id);
                        else setStage(item.id);
                        setConfirming(null);
                      }}
                      type="button"
                    >
                      <span className="desk-stage-number">{item.id === "history" ? "✓" : index + 1}</span>
                      <span className="desk-stage-label">{item.label}</span>
                      <span className="desk-stage-count">{counts[item.id]}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="desk-toolbar">
                {searching ? (
                  <p className="desk-todo" role="status">
                    <b>{matchedJobs.length > 1 ? `${matchedJobs.length} dossiers trouvés` : matchedJobs.length === 1 ? "1 dossier trouvé" : "Aucun dossier"}</b> pour « {trimmedQuery} »
                    {searchStageLabel && <> dans « {searchStageLabel} » · <button className="desk-link" onClick={() => setSearchStage("all")} type="button">toutes les étapes</button></>}
                  </p>
                ) : (
                  <p className="desk-todo"><b>À faire :</b> {activeStageInfo.todo}</p>
                )}
                <label className="desk-search">
                  <Icon name="search" />
                  <input
                    aria-label="Rechercher un dossier"
                    onChange={(event) => { setQuery(event.target.value); setSearchStage("all"); }}
                    onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); }}
                    placeholder="Nom, téléphone, référence, produit…  ( / )"
                    ref={searchRef}
                    type="search"
                    value={query}
                  />
                </label>
              </div>
              <div className="desk-list">
                {stageJobs.map((job) => renderJob(job, searching))}
                {!loading && stageJobs.length === 0 && (
                  <p className="admin-empty">
                    {searching ? `Aucun dossier ne correspond à « ${trimmedQuery} ». Essayez le nom du client, son téléphone ou la référence.` : activeStageInfo.empty}
                  </p>
                )}
              </div>
            </>
          )}

          {section === "prices" && (
            <div className="admin-prices-layout">
              <form className="admin-record admin-price-form" onSubmit={(event) => void createPrice(event)}>
                <h2>Publier un tarif</h2>
                <p>Indiquez le prix total pour une tranche de quantités. Exemple : 100 à 499 cartes de visite = 45 TND.</p>
                <label className="form-field"><span>Produit</span><select onChange={(event) => selectProduct(event.target.value)} required value={selectedProductId}>{products.map((product) => <option key={product.id} value={product.id}>{localized(product.translations, activeLocale)}</option>)}</select></label>
                <label className="form-field"><span>Format</span><select onChange={(event) => setSelectedVariantId(event.target.value)} required value={selectedVariantId}>{selectedProduct?.variants.map((variant) => <option key={variant.id} value={variant.id}>{localized(variant.translations, activeLocale)}</option>)}</select></label>
                {selectedProduct?.options.map((option) => (
                  <label className="form-field" key={option.id}>
                    <span>{localized(option.translations, activeLocale)}</span>
                    <select onChange={(event) => setOptionValues((current) => ({ ...current, [option.code]: event.target.value }))} required={option.is_required} value={optionValues[option.code] ?? ""}>
                      {!option.is_required && <option value="">Sans option</option>}
                      {option.values.map((value) => <option key={value.value} value={value.value}>{localized(value.labels, activeLocale)}</option>)}
                    </select>
                  </label>
                ))}
                <div className="admin-range-inputs">
                  <label className="form-field"><span>À partir de (quantité)</span><input min="1" onChange={(event) => setQuantityMin(event.target.value)} required type="number" value={quantityMin} /></label>
                  <label className="form-field"><span>Jusqu’à (quantité)</span><input min={quantityMin} onChange={(event) => setQuantityMax(event.target.value)} required type="number" value={quantityMax} /></label>
                </div>
                <label className="form-field"><span>Prix total (TND)</span><input inputMode="decimal" onChange={(event) => setTotalPrice(event.target.value)} placeholder="Ex. 45" required value={totalPrice} /></label>
                <button className="button button-dark" disabled={busyKey === "prices" || !selectedVariantId} type="submit">{busyKey === "prices" ? "Publication…" : "Publier ce tarif"}<span aria-hidden="true">↗</span></button>
              </form>
              <div className="admin-record admin-price-list">
                <h2>Tarifs visibles par les clients</h2>
                {tiers.map((tier) => (
                  <div className="admin-tier-row" key={tier.id}>
                    <div>
                      <strong>{tier.product_name} · {tier.variant_name}</strong>
                      <p>{describeOptions(tier.option_values).map((option) => `${option.label} : ${option.value}`).join(" · ") || "Sans option"} · de {tier.quantity_min} à {tier.quantity_max}</p>
                    </div>
                    <strong>{formatMoney(tier.total_price)}</strong>
                    {confirmable(`${tier.id}:remove`, "Retirer", "Retirer ce tarif du site ?", () => deactivatePrice(tier))}
                  </div>
                ))}
                {!loading && tiers.length === 0 && <p className="admin-empty">Aucun tarif publié : les clients demandent un devis pour chaque produit.</p>}
              </div>
            </div>
          )}

          {section === "images" && (
            <div className="admin-prices-layout">
              <form className="admin-record admin-price-form" onSubmit={(event) => void uploadProductImage(event)}>
                <h2>Ajouter une photo</h2>
                <p>Format JPG, PNG ou WebP, 8 Mo maximum. La première photo devient la photo principale.</p>
                <label className="form-field">
                  <span>Produit</span>
                  <select onChange={(event) => selectProduct(event.target.value)} required value={selectedProductId}>
                    {products.map((product) => <option key={product.id} value={product.id}>{localized(product.translations, activeLocale)}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span>Photo</span>
                  <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" name="product_image" required type="file" />
                </label>
                <label className="form-field"><span>Description courte (français)</span><input maxLength={300} onChange={(event) => setImageAltTexts((current) => ({ ...current, fr: event.target.value }))} placeholder="Ex. Cartes de visite mates recto verso" value={imageAltTexts.fr} /></label>
                <details className="desk-details">
                  <summary>Ajouter la description en arabe et en anglais (facultatif)</summary>
                  <label className="form-field"><span>Description (العربية)</span><input dir="rtl" maxLength={300} onChange={(event) => setImageAltTexts((current) => ({ ...current, ar: event.target.value }))} value={imageAltTexts.ar} /></label>
                  <label className="form-field"><span>Description (English)</span><input maxLength={300} onChange={(event) => setImageAltTexts((current) => ({ ...current, en: event.target.value }))} value={imageAltTexts.en} /></label>
                </details>
                <button className="button button-dark" disabled={busyKey === "images" || !selectedProduct} type="submit">
                  {busyKey === "images" ? "Envoi…" : "Ajouter la photo"}<span aria-hidden="true">↗</span>
                </button>
              </form>
              <div className="admin-record admin-image-list">
                <h2>Photos de {selectedProduct ? localized(selectedProduct.translations, activeLocale) : "produit"}</h2>
                {selectedProduct?.images.map((image) => (
                  <article className="admin-image-row" key={image.id}>
                    <Image alt={image.alt_texts.fr || localized(selectedProduct.translations, activeLocale)} height={90} src={assetUrl(image.url)} unoptimized width={120} />
                    <div className="admin-image-info">
                      <strong>{image.is_primary ? "Photo principale" : `Photo ${image.sort_order + 1}`}</strong>
                      <p>{image.alt_texts.fr || "Sans description"}</p>
                    </div>
                    <div className="admin-image-actions">
                      {!image.is_primary && <button className="admin-text-action" disabled={busyKey === image.id} onClick={() => updateProductImage(image)} type="button">Mettre en principale</button>}
                      {confirmable(`${image.id}:delete`, "Supprimer", "Supprimer cette photo ?", () => deleteProductImage(image))}
                    </div>
                  </article>
                ))}
                {!loading && selectedProduct?.images.length === 0 && <p className="admin-empty">Aucune photo pour ce produit.</p>}
              </div>
            </div>
          )}

          {section === "messages" && (
            <div className="desk-list">
              {notifications.map((notification) => (
                <article className="desk-card desk-message" key={notification.id}>
                  <div>
                    <strong>{notificationLabels[notification.event_type] ?? notification.event_type}</strong>
                    <p>Réf. {notification.reference} · {formatDate(notification.created_at)}</p>
                  </div>
                  <span className={`desk-status desk-status-${notification.status}`}>{notificationStatusLabels[notification.status]}</span>
                  {notification.status === "failed" && (
                    <div className="desk-message-actions">
                      <button className="desk-secondary" disabled={busyKey === notification.id} onClick={() => retryNotification(notification)} type="button">↻ Renvoyer</button>
                      {notification.last_error && (
                        <details className="desk-details"><summary>Détail technique</summary><p>{notification.last_error}</p></details>
                      )}
                    </div>
                  )}
                </article>
              ))}
              {!loading && notifications.length === 0 && <p className="admin-empty">Aucun message pour le moment. Ils apparaissent quand un client accepte de recevoir le suivi sur WhatsApp.</p>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
