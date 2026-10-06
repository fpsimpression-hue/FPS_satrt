"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { Brand } from "@/components/brand";
import {
  apiRequest,
  assetUrl,
  localized,
  type Product,
  type ProductImage,
} from "@/lib/api";

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
  quantity: number;
  selected_options: Record<string, string>;
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
type AdminTab = "quotes" | "orders" | "prices" | "images" | "notifications";

const statusLabels: Record<string, string> = {
  pending: "À traiter",
  quoted: "Devis préparé",
  accepted: "Converti en commande",
  declined: "Refusé / clôturé",
  pending_review: "À vérifier",
  confirmed: "Confirmée",
  in_production: "En production",
  ready: "Prête",
  completed: "Terminée",
  cancelled: "Annulée",
  approved: "Validé",
  rejected: "À corriger",
};
const notificationStatusLabels: Record<AdminNotification["status"], string> = {
  pending: "En attente",
  processing: "En cours d’envoi",
  sent: "Envoyée",
  failed: "Échec",
};
const notificationLabels: Record<string, string> = {
  quote_received: "Demande de devis reçue",
  quote_prepared: "Devis préparé",
  quote_declined: "Demande clôturée",
  order_received: "Commande reçue",
  order_confirmed: "Commande confirmée",
  order_in_production: "Production démarrée",
  order_ready: "Commande prête",
  order_completed: "Commande terminée",
  order_cancelled: "Commande annulée",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-TN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function optionSummary(options: Record<string, string>) {
  return Object.entries(options)
    .map(([key, value]) => `${key} : ${value}`)
    .join(" · ");
}

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<AdminTab>("quotes");
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
  const [quoteAmounts, setQuoteAmounts] = useState<Record<string, string>>({});
  const [loginBusy, setLoginBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const activeLocale = "fr" as const;

  const loadWorkspace = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
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
      if (!selectedProductId && productList.length) {
        const firstProduct = productList[0];
        setSelectedProductId(firstProduct.id);
        setSelectedVariantId(firstProduct.variants[0]?.id ?? "");
        setOptionValues(
          Object.fromEntries(
            firstProduct.options.map((option) => [
              option.code,
              option.values[0]?.value ?? "",
            ]),
          ),
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Les données de l’atelier sont indisponibles.");
      if (cause instanceof Error && cause.message.includes("401")) setUser(null);
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
        if (active && cause instanceof Error && !cause.message.includes("401")) {
          setError(cause.message);
        }
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
      setError(cause instanceof Error ? cause.message : "Connexion impossible.");
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
      setMessage("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La déconnexion a échoué.");
    }
  }

  async function updateQuote(quote: Quote, status: "quoted" | "declined") {
    setBusyKey(quote.id);
    setError("");
    setMessage("");
    try {
      const amount = quoteAmounts[quote.id] ?? quote.quoted_amount ?? "";
      const updated = await apiRequest<Quote>(`/admin/quotes/${quote.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          quoted_amount: status === "quoted" ? amount : null,
        }),
      });
      setQuotes((current) => current.map((item) => (item.id === quote.id ? updated : item)));
      setMessage(
        status === "quoted"
          ? "Le montant du devis est enregistré. Contactez le client pour lui communiquer l’offre."
          : "La demande a été clôturée.",
      );
      await loadWorkspace();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La mise à jour du devis a échoué.");
    } finally {
      setBusyKey("");
    }
  }

  async function convertQuote(quote: Quote) {
    setBusyKey(quote.id);
    setError("");
    setMessage("");
    try {
      const order = await apiRequest<AdminOrder>(
        `/admin/quotes/${quote.id}/convert-to-order`,
        { method: "POST" },
      );
      setMessage(`La commande ${order.reference} est créée et prête à être vérifiée.`);
      await loadWorkspace();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La conversion en commande a échoué.");
    } finally {
      setBusyKey("");
    }
  }

  async function attachFile(quote: Quote, file: File | undefined) {
    if (!file) return;
    setBusyKey(quote.id);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const updated = await apiRequest<Quote>(`/admin/quotes/${quote.id}/files`, {
        method: "POST",
        body,
      });
      setQuotes((current) => current.map((item) => (item.id === quote.id ? updated : item)));
      setMessage("Le fichier a été ajouté à la demande.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le fichier n’a pas pu être ajouté.");
    } finally {
      setBusyKey("");
    }
  }

  async function updateOrderStatus(order: AdminOrder, status: AdminOrder["status"]) {
    setBusyKey(order.id);
    setError("");
    setMessage("");
    try {
      const updated = await apiRequest<AdminOrder>(`/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) => current.map((item) => (item.id === order.id ? updated : item)));
      setMessage(`La commande ${order.reference} est maintenant « ${statusLabels[status]} ».`);
      await loadWorkspace();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le statut n’a pas pu être modifié.");
    } finally {
      setBusyKey("");
    }
  }

  async function reviewFile(file: AdminFile, reviewStatus: "approved" | "rejected") {
    setBusyKey(file.id);
    setError("");
    try {
      await apiRequest(`/admin/files/${file.id}/review?review_status=${reviewStatus}`, {
        method: "PATCH",
      });
      setMessage(
        reviewStatus === "approved"
          ? "Le fichier a été validé. La production reste bloquée tant que tous les fichiers de la commande ne sont pas validés."
          : "Le fichier est marqué à corriger. Contactez le client pour obtenir une nouvelle version.",
      );
      await loadWorkspace();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le statut du fichier n’a pas pu être modifié.");
    } finally {
      setBusyKey("");
    }
  }

  function selectProduct(productId: string) {
    const nextProduct = products.find((product) => product.id === productId);
    setSelectedProductId(productId);
    setImageAltTexts({ fr: "", ar: "", en: "" });
    setSelectedVariantId(nextProduct?.variants[0]?.id ?? "");
    setOptionValues(
      Object.fromEntries(
        (nextProduct?.options ?? []).map((option) => [
          option.code,
          option.values[0]?.value ?? "",
        ]),
      ),
    );
  }

  async function createPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;
    setBusyKey("prices");
    setError("");
    setMessage("");
    try {
      await apiRequest<PriceTier>("/admin/prices", {
        method: "POST",
        body: JSON.stringify({
          product_id: selectedProduct.id,
          variant_id: selectedVariantId,
          option_values: optionValues,
          quantity_min: Number(quantityMin),
          quantity_max: Number(quantityMax),
          total_price: totalPrice,
        }),
      });
      setTotalPrice("");
      setMessage("La grille de prix est publiée et le site recalcule maintenant cette combinaison.");
      await loadWorkspace();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le prix n’a pas pu être enregistré.");
    } finally {
      setBusyKey("");
    }
  }

  async function deactivatePrice(tier: PriceTier) {
    setBusyKey(tier.id);
    setError("");
    try {
      await apiRequest<void>(`/admin/prices/${tier.id}`, { method: "DELETE" });
      setMessage("Le prix est désactivé ; le site proposera à nouveau un devis pour cette combinaison.");
      await loadWorkspace();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le prix n’a pas pu être désactivé.");
    } finally {
      setBusyKey("");
    }
  }

  async function retryNotification(notification: AdminNotification) {
    setBusyKey(notification.id);
    setError("");
    setMessage("");
    try {
      await apiRequest<AdminNotification>(
        `/admin/notifications/${notification.id}/retry`,
        { method: "POST" },
      );
      setMessage(`Le message pour ${notification.reference} a été remis dans la file d’envoi.`);
      await loadWorkspace();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le message n’a pas pu être relancé.");
    } finally {
      setBusyKey("");
    }
  }

  async function uploadProductImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("product_image");
    if (!(fileInput instanceof HTMLInputElement) || !fileInput.files?.[0]) return;

    setBusyKey("images");
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      body.append("image", fileInput.files[0]);
      body.append("alt_fr", imageAltTexts.fr);
      body.append("alt_ar", imageAltTexts.ar);
      body.append("alt_en", imageAltTexts.en);
      body.append("is_primary", String(selectedProduct.images.length === 0));
      await apiRequest<ProductImage>(`/admin/products/${selectedProduct.id}/images`, {
        method: "POST",
        body,
      });
      form.reset();
      setImageAltTexts({ fr: "", ar: "", en: "" });
      setMessage("L’image du produit a été ajoutée à sa galerie.");
      await loadWorkspace();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’image n’a pas pu être ajoutée.");
    } finally {
      setBusyKey("");
    }
  }

  async function updateProductImage(
    image: ProductImage,
    changes: { is_primary?: boolean; sort_order?: number },
  ) {
    if (!selectedProduct) return;
    setBusyKey(image.id);
    setError("");
    setMessage("");
    try {
      await apiRequest<ProductImage>(
        `/admin/products/${selectedProduct.id}/images/${image.id}`,
        { method: "PATCH", body: JSON.stringify(changes) },
      );
      setMessage(
        changes.is_primary
          ? "L’image principale du produit a été mise à jour."
          : "L’ordre de la galerie a été mis à jour.",
      );
      await loadWorkspace();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’image n’a pas pu être mise à jour.");
    } finally {
      setBusyKey("");
    }
  }

  async function deleteProductImage(image: ProductImage) {
    if (!selectedProduct || !window.confirm("Supprimer cette image du catalogue ?")) return;
    setBusyKey(image.id);
    setError("");
    setMessage("");
    try {
      await apiRequest<void>(
        `/admin/products/${selectedProduct.id}/images/${image.id}`,
        { method: "DELETE" },
      );
      setMessage("L’image a été supprimée de la galerie.");
      await loadWorkspace();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’image n’a pas pu être supprimée.");
    } finally {
      setBusyKey("");
    }
  }

  if (!sessionChecked) {
    return <main className="admin-loading">Vérification de la session sécurisée…</main>;
  }

  if (!user) {
    return (
      <main className="admin-login-page">
        <Brand href="/" />
        <form className="admin-login-card" onSubmit={login}>
          <p className="eyebrow"><span />ESPACE ÉQUIPE</p>
          <h1>Administration</h1>
          <p>Connectez-vous pour traiter les demandes et préparer la production.</p>
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

  const navItems: { id: AdminTab; label: string }[] = [
    { id: "quotes", label: "Demandes de devis" },
    { id: "orders", label: "Commandes atelier" },
    { id: "prices", label: "Grilles de prix" },
    { id: "images", label: "Images produits" },
    { id: "notifications", label: "Notifications" },
  ];

  return (
    <main className="admin-app">
      <header className="admin-header">
        <Brand href="/" />
        <div className="admin-header-right">
          <span>Connecté : {user.username}</span>
          <button className="admin-logout" onClick={() => void logout()} type="button">Déconnexion</button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p className="admin-sidebar-label">ATELIER</p>
          {navItems.map((item) => (
            <button
              aria-current={tab === item.id ? "page" : undefined}
              className={tab === item.id ? "admin-nav-item active" : "admin-nav-item"}
              key={item.id}
              onClick={() => setTab(item.id)}
              type="button"
            >
              <span aria-hidden="true">{item.id === "quotes" ? "▤" : item.id === "orders" ? "▣" : item.id === "prices" ? "◈" : item.id === "images" ? "▧" : "↗"}</span>
              {item.label}
              {item.id === "quotes" && overview?.pending_quotes ? <b>{overview.pending_quotes}</b> : null}
              {item.id === "orders" && overview?.orders_to_review ? <b>{overview.orders_to_review}</b> : null}
              {item.id === "notifications" && overview?.whatsapp_failed ? <b>{overview.whatsapp_failed}</b> : null}
            </button>
          ))}
          <p className="admin-sidebar-note">Les changements de statut sont enregistrés directement dans la base du site.</p>
        </aside>

        <section className="admin-main">
          <div className="admin-page-title">
            <div>
              <p className="eyebrow"><span />FAST PRINT SAHLINE</p>
              <h1>{tab === "quotes" ? "Demandes de devis" : tab === "orders" ? "Commandes atelier" : tab === "prices" ? "Grilles de prix" : tab === "images" ? "Images produits" : "Notifications WhatsApp"}</h1>
            </div>
            <button className="admin-refresh" disabled={loading} onClick={() => void loadWorkspace()} type="button">
              {loading ? "Actualisation…" : "↻ Actualiser"}
            </button>
          </div>

          {overview && (
            <div className="admin-stats">
              <div><span>Devis à traiter</span><strong>{overview.pending_quotes}</strong></div>
              <div><span>Devis préparés</span><strong>{overview.quoted_requests}</strong></div>
              <div><span>Commandes à vérifier</span><strong>{overview.orders_to_review}</strong></div>
              <div><span>En production</span><strong>{overview.orders_in_production}</strong></div>
              <div><span>Prêtes au retrait</span><strong>{overview.orders_ready}</strong></div>
              <div><span>Messages en attente</span><strong>{overview.whatsapp_pending}</strong></div>
              <div><span>Messages en échec</span><strong>{overview.whatsapp_failed}</strong></div>
            </div>
          )}

          {error && <p className="admin-alert error" role="alert">{error}</p>}
          {message && <p className="admin-alert success" role="status">{message}</p>}

          {tab === "quotes" && (
            <div className="admin-record-list">
              {quotes.map((quote) => (
                <article className="admin-record" key={quote.id}>
                  <div className="admin-record-heading">
                    <div><span className="admin-reference">{quote.reference}</span><span className={`status-pill status-${quote.status}`}>{statusLabels[quote.status]}</span></div>
                    <time>{formatDate(quote.created_at)}</time>
                  </div>
                  <div className="admin-record-columns">
                    <div>
                      <h2>{quote.product_name} <span>· {quote.variant_name}</span></h2>
                      <p>Quantité : <strong>{quote.quantity.toLocaleString("fr-TN")}</strong></p>
                      <p>Options : <strong>{optionSummary(quote.selected_options) || "Aucune"}</strong></p>
                      <p>Réception : <strong>{quote.fulfillment_method === "delivery" ? "Livraison" : "Retrait à l’atelier"}</strong></p>
                      {quote.delivery_address && <p>Adresse : {quote.delivery_address}</p>}
                      {quote.notes && <p>Note : {quote.notes}</p>}
                    </div>
                    <div className="customer-contact">
                      <strong>{quote.customer_name}</strong>
                      <a href={`tel:${quote.customer_phone}`}>{quote.customer_phone}</a>
                      {quote.customer_email && <a href={`mailto:${quote.customer_email}`}>{quote.customer_email}</a>}
                    </div>
                  </div>
                  <div className="admin-files">
                    <strong>Fichiers reçus</strong>
                    {quote.files.map((file) => (
                      <a href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/admin/files/${file.id}/download`} key={file.id}>
                        ↧ {file.original_filename} <span className={`status-pill status-${file.review_status}`}>{statusLabels[file.review_status]}</span>
                      </a>
                    ))}
                    <label className="admin-upload-button">
                      + Ajouter un fichier prêt à imprimer
                      <input accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,application/pdf,image/png,image/jpeg,image/tiff" disabled={busyKey === quote.id} onChange={(event) => { void attachFile(quote, event.target.files?.[0]); event.currentTarget.value = ""; }} type="file" />
                    </label>
                  </div>
                  {quote.status === "pending" || quote.status === "quoted" ? (
                    <div className="admin-record-actions">
                      <label className="admin-price-input">
                        <span>Montant total proposé (TND)</span>
                        <input aria-label={`Montant du devis ${quote.reference}`} inputMode="decimal" min="0" onChange={(event) => setQuoteAmounts((current) => ({ ...current, [quote.id]: event.target.value }))} placeholder="Ex. 25,000" step="0.001" type="number" value={quoteAmounts[quote.id] ?? quote.quoted_amount ?? ""} />
                      </label>
                      <button className="button button-dark" disabled={busyKey === quote.id || !(quoteAmounts[quote.id] ?? quote.quoted_amount)} onClick={() => void updateQuote(quote, "quoted")} type="button">
                        Enregistrer le devis
                      </button>
                      {quote.status === "quoted" && (
                        <button className="button button-outline" disabled={busyKey === quote.id} onClick={() => void convertQuote(quote)} type="button">
                          Accord client : créer la commande
                        </button>
                      )}
                      <button className="admin-text-action" disabled={busyKey === quote.id} onClick={() => void updateQuote(quote, "declined")} type="button">
                        Clôturer
                      </button>
                    </div>
                  ) : quote.quoted_amount && (
                    <p className="admin-saved-price">Montant convenu : <strong>{quote.quoted_amount} TND</strong></p>
                  )}
                </article>
              ))}
              {!loading && quotes.length === 0 && <p className="admin-empty">Aucune demande de devis pour le moment.</p>}
            </div>
          )}

          {tab === "orders" && (
            <div className="admin-record-list">
              {orders.map((order) => (
                <article className="admin-record" key={order.id}>
                  <div className="admin-record-heading">
                    <div><span className="admin-reference">{order.reference}</span><span className={`status-pill status-${order.status}`}>{statusLabels[order.status]}</span></div>
                    <time>{formatDate(order.created_at)}</time>
                  </div>
                  <div className="admin-record-columns">
                    <div>
                      {order.items.map((item, index) => (
                        <div className="admin-order-item" key={`${order.id}-${index}`}>
                          <h2>{item.product_name} <span>· {item.variant_name}</span></h2>
                          <p>Quantité : <strong>{item.quantity.toLocaleString("fr-TN")}</strong> · {optionSummary(item.selected_options) || "Sans option"}</p>
                          <p>Total ligne : <strong>{item.line_total} TND</strong></p>
                          {item.files.map((file) => (
                            <div className="admin-file-row" key={file.id}>
                              <a href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/admin/files/${file.id}/download`}>↧ {file.original_filename}</a>
                              <span className={`status-pill status-${file.review_status}`}>{statusLabels[file.review_status]}</span>
                              <button disabled={busyKey === file.id} onClick={() => void reviewFile(file, "approved")} type="button">Valider</button>
                              <button disabled={busyKey === file.id} onClick={() => void reviewFile(file, "rejected")} type="button">À corriger</button>
                            </div>
                          ))}
                        </div>
                      ))}
                      <p className="admin-order-total">Total commande : <strong>{order.total_amount} TND</strong></p>
                      <p>Réception : <strong>{order.fulfillment_method === "delivery" ? "Livraison" : "Retrait à l’atelier"}</strong></p>
                      {order.delivery_address && <p>Adresse : {order.delivery_address}</p>}
                      <p>Paiement : à la livraison ou au retrait.</p>
                    </div>
                    <div className="customer-contact">
                      <strong>{order.customer_name}</strong>
                      <a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
                      {order.customer_email && <a href={`mailto:${order.customer_email}`}>{order.customer_email}</a>}
                    </div>
                  </div>
                  <div className="admin-record-actions">
                    {order.status === "pending_review" && <button className="button button-dark" disabled={busyKey === order.id} onClick={() => void updateOrderStatus(order, "confirmed")} type="button">Confirmer la commande</button>}
                    {order.status === "confirmed" && <button className="button button-dark" disabled={busyKey === order.id} onClick={() => void updateOrderStatus(order, "in_production")} type="button">Démarrer la production</button>}
                    {order.status === "in_production" && <button className="button button-dark" disabled={busyKey === order.id} onClick={() => void updateOrderStatus(order, "ready")} type="button">Marquer prête</button>}
                    {order.status === "ready" && <button className="button button-dark" disabled={busyKey === order.id} onClick={() => void updateOrderStatus(order, "completed")} type="button">Marquer remise au client</button>}
                    {["pending_review", "confirmed", "in_production"].includes(order.status) && <button className="admin-text-action danger" disabled={busyKey === order.id} onClick={() => void updateOrderStatus(order, "cancelled")} type="button">Annuler</button>}
                  </div>
                </article>
              ))}
              {!loading && orders.length === 0 && <p className="admin-empty">Aucune commande pour le moment.</p>}
            </div>
          )}

          {tab === "prices" && (
            <div className="admin-prices-layout">
              <form className="admin-record admin-price-form" onSubmit={createPrice}>
                <h2>Publier un tarif validé</h2>
                <p>Le prix affiché aux clients est le montant total en TND pour cette combinaison et cette tranche.</p>
                <label className="form-field"><span>Produit</span><select onChange={(event) => selectProduct(event.target.value)} required value={selectedProductId}>{products.map((product) => <option key={product.id} value={product.id}>{localized(product.translations, activeLocale)}</option>)}</select></label>
                <label className="form-field"><span>Format / variante</span><select onChange={(event) => setSelectedVariantId(event.target.value)} required value={selectedVariantId}>{selectedProduct?.variants.map((variant) => <option key={variant.id} value={variant.id}>{localized(variant.translations, activeLocale)}</option>)}</select></label>
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
                  <label className="form-field"><span>Quantité minimale</span><input min="1" onChange={(event) => setQuantityMin(event.target.value)} required type="number" value={quantityMin} /></label>
                  <label className="form-field"><span>Quantité maximale</span><input min={quantityMin} onChange={(event) => setQuantityMax(event.target.value)} required type="number" value={quantityMax} /></label>
                </div>
                <label className="form-field"><span>Total à facturer (TND)</span><input inputMode="decimal" min="0" onChange={(event) => setTotalPrice(event.target.value)} required step="0.001" type="number" value={totalPrice} /></label>
                <button className="button button-dark" disabled={busyKey === "prices" || !selectedVariantId} type="submit">{busyKey === "prices" ? "Enregistrement…" : "Publier le tarif"}<span aria-hidden="true">↗</span></button>
              </form>
              <div className="admin-record admin-price-list">
                <h2>Tarifs actuellement publiés</h2>
                {tiers.map((tier) => (
                  <div className="admin-tier-row" key={tier.id}>
                    <div><strong>{tier.product_name} · {tier.variant_name}</strong><p>{optionSummary(tier.option_values) || "Sans option"} · {tier.quantity_min}–{tier.quantity_max} unités</p></div>
                    <strong>{tier.total_price} TND</strong>
                    <button aria-label={`Désactiver le tarif ${tier.product_name}`} disabled={busyKey === tier.id} onClick={() => void deactivatePrice(tier)} type="button">Désactiver</button>
                  </div>
                ))}
                {!loading && tiers.length === 0 && <p className="admin-empty">Aucun prix publié. Le site orientera les combinaisons non tarifées vers un devis.</p>}
              </div>
            </div>
          )}
          {tab === "images" && (
            <div className="admin-prices-layout">
              <form className="admin-record admin-price-form" onSubmit={(event) => void uploadProductImage(event)}>
                <h2>Ajouter une image</h2>
                <p>JPG, PNG ou WebP ; maximum 8 Mo par image et 20 images par produit. Les fichiers d’impression client restent séparés.</p>
                <label className="form-field">
                  <span>Produit</span>
                  <select onChange={(event) => selectProduct(event.target.value)} required value={selectedProductId}>
                    {products.map((product) => <option key={product.id} value={product.id}>{localized(product.translations, activeLocale)}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span>Fichier image</span>
                  <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" name="product_image" required type="file" />
                </label>
                <label className="form-field"><span>Description alternative (français)</span><input maxLength={300} onChange={(event) => setImageAltTexts((current) => ({ ...current, fr: event.target.value }))} value={imageAltTexts.fr} /></label>
                <label className="form-field"><span>Description alternative (العربية)</span><input dir="rtl" maxLength={300} onChange={(event) => setImageAltTexts((current) => ({ ...current, ar: event.target.value }))} value={imageAltTexts.ar} /></label>
                <label className="form-field"><span>Description alternative (English)</span><input maxLength={300} onChange={(event) => setImageAltTexts((current) => ({ ...current, en: event.target.value }))} value={imageAltTexts.en} /></label>
                <button className="button button-dark" disabled={busyKey === "images" || !selectedProduct} type="submit">
                  {busyKey === "images" ? "Téléversement…" : "Ajouter à la galerie"}<span aria-hidden="true">↗</span>
                </button>
              </form>
              <div className="admin-record admin-image-list">
                <h2>Galerie de {selectedProduct ? localized(selectedProduct.translations, activeLocale) : "produit"}</h2>
                {selectedProduct?.images.map((image) => (
                  <article className="admin-image-row" key={image.id}>
                    <Image alt={image.alt_texts.fr || localized(selectedProduct.translations, activeLocale)} height={90} src={assetUrl(image.url)} unoptimized width={120} />
                    <div className="admin-image-info">
                      <strong>{image.is_primary ? "Image principale" : `Image ${image.sort_order + 1}`}</strong>
                      <p>{image.content_type} · {(image.size_bytes / 1024 / 1024).toFixed(2)} Mo</p>
                    </div>
                    <div className="admin-image-actions">
                      {!image.is_primary && <button className="admin-text-action" disabled={busyKey === image.id} onClick={() => void updateProductImage(image, { is_primary: true })} type="button">Définir principale</button>}
                      <button className="admin-text-action danger" disabled={busyKey === image.id} onClick={() => void deleteProductImage(image)} type="button">Supprimer</button>
                    </div>
                  </article>
                ))}
                {!loading && selectedProduct?.images.length === 0 && <p className="admin-empty">Aucune image. Ajoutez des visuels pour les afficher dans le catalogue.</p>}
              </div>
            </div>
          )}
          {tab === "notifications" && (
            <div className="admin-record-list">
              <p className="admin-sidebar-note">Les notifications sont envoyées automatiquement après consentement explicite. Les échecs transitoires sont retentés ; les erreurs définitives peuvent être relancées ici après correction de la configuration.</p>
              {notifications.map((notification) => (
                <article className="admin-record notification-record" key={notification.id}>
                  <div className="admin-record-heading">
                    <div>
                      <span className="admin-reference">{notification.reference}</span>
                      <span className={`status-pill status-${notification.status}`}>{notificationStatusLabels[notification.status]}</span>
                    </div>
                    <time>{formatDate(notification.created_at)}</time>
                  </div>
                  <p>{notificationLabels[notification.event_type] ?? notification.event_type} · {notification.attempts} tentative(s)</p>
                  {notification.last_error && <p className="admin-alert error">{notification.last_error}</p>}
                  {notification.status === "failed" && (
                    <button className="admin-text-action" disabled={busyKey === notification.id} onClick={() => void retryNotification(notification)} type="button">
                      {busyKey === notification.id ? "Relance…" : "↻ Réessayer"}
                    </button>
                  )}
                </article>
              ))}
              {!loading && notifications.length === 0 && <p className="admin-empty">Aucune notification à afficher. Les mises à jour nécessitent le consentement WhatsApp du client.</p>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
