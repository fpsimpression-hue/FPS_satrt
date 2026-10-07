"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  apiRequest,
  getLocale,
  localized,
  type CustomerDetails,
  type Locale,
  type PriceCheck,
  type Product,
  type UploadResult,
  assetUrl,
} from "@/lib/api";

const copy = {
  fr: {
    catalogue: "Catalogue",
    breadcrumb: "Fil d’Ariane",
    loading: "Chargement du produit…",
    error: "Impossible de charger ce produit.",
    variant: "Format",
    quantity: "Quantité",
    customer: "Vos coordonnées",
    name: "Nom complet",
    phone: "Téléphone",
    email: "E-mail (facultatif)",
    file: "Fichier prêt à imprimer (PDF, PNG, JPEG ou TIFF ; 25 Mo maximum)",
    fulfillment: "Réception",
    pickup: "Retrait à l’atelier",
    delivery: "Livraison",
    address: "Adresse de livraison",
    checkPrice: "Vérifier le tarif",
    quote: "Demander un devis",
    order: "Commander",
    noPrice: "Pas de tarif validé pour cette combinaison. Envoyez-nous une demande de devis.",
    price: "Total confirmé",
    payment: "Paiement à la livraison ou au retrait. La production débute après vérification du fichier.",
    successQuote: "Votre demande de devis est enregistrée. Référence :",
    successOrder: "Votre commande est enregistrée. Référence :",
    deliveryQuote: "Les frais de livraison seront confirmés avec le devis.",
    missingFile: "Ajoutez votre fichier prêt à imprimer pour confirmer une commande.",
    required: "Obligatoire",
    language: "Langue",
    product: "Produit",
    fileLabel: "Fichier",
    notes: "Détails de votre demande (facultatif)",
    channel: "Mode d’envoi",
    team: "Envoyer à l’équipe Fast Print",
    teamDescription: "La demande sera enregistrée dans l’espace équipe pour suivi.",
    whatsapp: "Continuer sur WhatsApp",
    whatsappDescription: "Un message prérempli s’ouvrira. Vous pourrez joindre votre fichier dans la conversation.",
    whatsappGreeting: "Bonjour Fast Print Sahline, je souhaite envoyer cette demande.",
    whatsappAttachment: "Je joindrai le fichier dans cette conversation.",
    whatsappReady: "Votre message WhatsApp est prêt.",
    whatsappOpen: "Ouvrir WhatsApp",
    whatsappConsent: "J’accepte de recevoir sur WhatsApp les mises à jour concernant cette demande ou commande. Je peux retirer mon accord en contactant l’atelier.",
  },
  ar: {
    catalogue: "الكتالوج",
    breadcrumb: "مسار التصفح",
    loading: "جارٍ تحميل المنتج…",
    error: "تعذّر تحميل هذا المنتج.",
    variant: "الحجم",
    quantity: "الكمية",
    customer: "بيانات الاتصال",
    name: "الاسم الكامل",
    phone: "الهاتف",
    email: "البريد الإلكتروني (اختياري)",
    file: "ملف جاهز للطباعة (PDF أو PNG أو JPEG أو TIFF؛ 25 م.ب كحد أقصى)",
    fulfillment: "الاستلام",
    pickup: "الاستلام من الورشة",
    delivery: "التوصيل",
    address: "عنوان التوصيل",
    checkPrice: "التحقق من السعر",
    quote: "طلب عرض سعر",
    order: "تأكيد الطلب",
    noPrice: "لا يوجد سعر معتمد لهذه الخيارات. أرسلوا طلب عرض سعر.",
    price: "السعر الإجمالي المؤكد",
    payment: "الدفع عند الاستلام. يبدأ الإنتاج بعد مراجعة الملف.",
    successQuote: "تم تسجيل طلب عرض السعر. المرجع:",
    successOrder: "تم تسجيل طلبكم. المرجع:",
    deliveryQuote: "سيتم تأكيد رسوم التوصيل ضمن عرض السعر.",
    missingFile: "أضيفوا ملفكم الجاهز للطباعة لتأكيد الطلب.",
    required: "مطلوب",
    language: "اللغة",
    product: "المنتج",
    fileLabel: "الملف",
    notes: "تفاصيل الطلب (اختياري)",
    channel: "طريقة الإرسال",
    team: "إرسال إلى فريق فاست برينت",
    teamDescription: "سيُحفظ الطلب في مساحة الفريق للمتابعة.",
    whatsapp: "المتابعة عبر واتساب",
    whatsappDescription: "ستُفتح رسالة جاهزة، ويمكنكم إرفاق الملف في المحادثة.",
    whatsappGreeting: "مرحباً فاست برينت الساحلين، أرسل هذا الطلب.",
    whatsappAttachment: "سأرفق الملف في هذه المحادثة.",
    whatsappReady: "رسالتكم جاهزة للإرسال عبر واتساب.",
    whatsappOpen: "فتح واتساب",
    whatsappConsent: "أوافق على تلقي تحديثات هذا الطلب عبر واتساب. يمكنني سحب موافقتي بالتواصل مع الورشة.",
  },
  en: {
    catalogue: "Catalogue",
    breadcrumb: "Breadcrumb",
    loading: "Loading product…",
    error: "This product could not be loaded.",
    variant: "Format",
    quantity: "Quantity",
    customer: "Your details",
    name: "Full name",
    phone: "Phone",
    email: "Email (optional)",
    file: "Print-ready file (PDF, PNG, JPEG or TIFF; 25 MB maximum)",
    fulfillment: "Fulfilment",
    pickup: "Collect from the shop",
    delivery: "Delivery",
    address: "Delivery address",
    checkPrice: "Check price",
    quote: "Request a quote",
    order: "Place order",
    noPrice: "No approved price for this combination. Send us a quote request.",
    price: "Confirmed total",
    payment: "Pay on collection or delivery. Production starts after your file is reviewed.",
    successQuote: "Your quote request is registered. Reference:",
    successOrder: "Your order is registered. Reference:",
    deliveryQuote: "Delivery fees will be confirmed with your quote.",
    missingFile: "Add your print-ready file to place an order.",
    required: "Required",
    language: "Language",
    product: "Product",
    fileLabel: "File",
    notes: "Request details (optional)",
    channel: "How to send",
    team: "Send to the Fast Print team",
    teamDescription: "Your request will be saved in the team workspace for follow-up.",
    whatsapp: "Continue on WhatsApp",
    whatsappDescription: "A prefilled message will open. You can attach your file in the conversation.",
    whatsappGreeting: "Hello Fast Print Sahline, I would like to send this request.",
    whatsappAttachment: "I will attach the file in this conversation.",
    whatsappReady: "Your WhatsApp message is ready.",
    whatsappOpen: "Open WhatsApp",
    whatsappConsent: "I agree to receive WhatsApp updates about this request or order. I can withdraw my consent by contacting the workshop.",
  },
} satisfies Record<Locale, Record<string, string>>;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default function ProductPage({ params }: ProductPageProps) {
  const [slug, setSlug] = useState("");
  const [locale, setLocale] = useState<Locale>("fr");
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [options, setOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(100);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [submissionChannel, setSubmissionChannel] = useState<"team" | "whatsapp">("team");
  const [price, setPrice] = useState<PriceCheck | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [whatsAppUrl, setWhatsAppUrl] = useState("");
  const text = copy[locale];

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState(null, "", url);
  }

  useEffect(() => {
    setLocale(getLocale());
    void params.then((value) => setSlug(value.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    apiRequest<Product>(`/catalog/products/${encodeURIComponent(slug)}`)
      .then((result) => {
        if (cancelled) return;
        setProduct(result);
        setSelectedVariant(result.variants[0]?.id ?? "");
        setOptions(Object.fromEntries(result.options.map((option) => [option.code, option.values[0]?.value ?? ""])));
      })
      .catch(() => {
        if (!cancelled) setError(text.error);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, text.error]);

  async function checkPrice(): Promise<PriceCheck> {
    if (!product || !selectedVariant) throw new Error(text.error);
    const result = await apiRequest<PriceCheck>(`/catalog/products/${product.id}/price`, {
      method: "POST",
      body: JSON.stringify({ variant_id: selectedVariant, quantity, options }),
    });
    setPrice(result);
    return result;
  }

  async function uploadFile(file: File | undefined): Promise<string[]> {
    if (!file) return [];
    const data = new FormData();
    data.append("file", file);
    const uploaded = await apiRequest<UploadResult>("/uploads", { method: "POST", body: data });
    return [uploaded.id];
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    setBusy(true);
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    const customer: CustomerDetails = {
      full_name: String(form.get("full_name")),
      phone: String(form.get("phone")),
      email: String(form.get("email") || "") || undefined,
      locale,
      whatsapp_opt_in: form.get("whatsapp_opt_in") === "on",
    };
    const requestNotes = String(form.get("notes") || "").trim() || undefined;

    try {
      if (submissionChannel === "whatsapp") {
        const variant = product.variants.find((item) => item.id === selectedVariant);
        const optionLines = product.options.flatMap((option) => {
          const selected = option.values.find((value) => value.value === options[option.code]);
          return selected ? [`${localized(option.translations, locale)}: ${localized(selected.labels, locale)}`] : [];
        });
        const selectedFile = form.get("print_file");
        const fileName = selectedFile instanceof File && selectedFile.name ? selectedFile.name : text.whatsappAttachment;
        const deliveryAddress = String(form.get("delivery_address") || "").trim();
        const message = [
          text.whatsappGreeting,
          `${text.product}: ${localized(product.translations, locale)}`,
          variant ? `${text.variant}: ${localized(variant.translations, locale)}` : "",
          ...optionLines,
          `${text.quantity}: ${quantity}`,
          `${text.name}: ${customer.full_name}`,
          `${text.phone}: ${customer.phone}`,
          customer.email ? `${text.email}: ${customer.email}` : "",
          `${text.fulfillment}: ${fulfillment === "pickup" ? text.pickup : text.delivery}`,
          deliveryAddress ? `${text.address}: ${deliveryAddress}` : "",
          `${text.fileLabel}: ${fileName}`,
          requestNotes ? `${text.notes}: ${requestNotes}` : "",
        ].filter(Boolean).join("\n");
        const url = `https://wa.me/21623267178?text=${encodeURIComponent(message)}`;
        setWhatsAppUrl(url);
        setSuccess(text.whatsappReady);
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      const currentPrice = price ?? await checkPrice();
      if (!price) return;
      const selectedFile = form.get("print_file");
      const fileIds = await uploadFile(selectedFile instanceof File ? selectedFile : undefined);
      if (currentPrice.status === "quote_required" || fulfillment === "delivery") {
        if (currentPrice.status === "priced" && fulfillment === "delivery" && !fileIds.length) {
          throw new Error(text.missingFile);
        }
        const result = await apiRequest<{ reference: string }>("/quote-requests", {
          method: "POST",
          body: JSON.stringify({
            product_id: product.id,
            variant_id: selectedVariant,
            quantity,
            options,
            customer,
            file_ids: fileIds,
            fulfillment_method: fulfillment,
            delivery_address: fulfillment === "delivery" ? String(form.get("delivery_address") || "").trim() : null,
            notes: [requestNotes, fulfillment === "delivery" ? text.deliveryQuote : null].filter(Boolean).join("\n") || null,
          }),
        });
        setSuccess(`${text.successQuote} ${result.reference}`);
        return;
      }

      const result = await apiRequest<{ reference: string; total_amount: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,
          variant_id: selectedVariant,
          quantity,
          options,
          customer,
          file_ids: fileIds,
          fulfillment_method: "pickup",
          delivery_address: null,
          payment_method: "cash_on_fulfillment",
          notes: requestNotes ?? null,
        }),
      });
      setSuccess(`${text.successOrder} ${result.reference}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shop-page product-page" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <SiteHeader locale={locale} onLocaleChange={changeLocale} />
      <div className="product-content">
        {!product && !error && <p className="catalogue-message" role="status">{text.loading}</p>}
        {error && !product && <p className="catalogue-message catalogue-error" role="alert">{error}</p>}
        {product && (
          <>
            <nav className="product-breadcrumb" aria-label={text.breadcrumb}>
              <Link href={`/catalogue?lang=${locale}`}>{text.catalogue}</Link>
              <span aria-hidden="true">/</span>
              <span>{localized(product.category.translations, locale)}</span>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{localized(product.translations, locale)}</span>
            </nav>
            <section className="product-overview">
              <div className="product-gallery" aria-label={localized(product.translations, locale)}>
                {product.images.length > 0 ? [...product.images]
                  .sort((left, right) => Number(right.is_primary) - Number(left.is_primary) || left.sort_order - right.sort_order)
                  .map((image, index) => (
                    <Image
                      alt={image.alt_texts[locale] || localized(product.translations, locale)}
                      className={index === 0 ? "product-gallery-image primary" : "product-gallery-image"}
                      height={520}
                      key={image.id}
                      loading={index === 0 ? "eager" : "lazy"}
                      src={assetUrl(image.url)}
                      unoptimized
                      width={900}
                    />
                  )) : (
                    <div className="product-gallery-empty">
                      <span>FAST PRINT</span>
                      <strong>{localized(product.category.translations, locale)}</strong>
                    </div>
                  )}
              </div>
              <div className="product-summary">
                <p className="eyebrow"><span />{localized(product.category.translations, locale)}</p>
                <h1>{localized(product.translations, locale)}</h1>
                <p>{localized(product.descriptions, locale)}</p>
                <a className="button button-orange product-quote-cta" href="#product-form">{text.quote}</a>
              </div>
            </section>
            <form className="product-form" id="product-form" onSubmit={submit}>
              <section className="product-config">
                <h2>{text.variant}</h2>
                <label className="form-field">
                  <span>{text.variant}</span>
                  <select required onChange={(event) => { setSelectedVariant(event.target.value); setPrice(null); }} value={selectedVariant}>
                    {product.variants.map((variant) => <option key={variant.id} value={variant.id}>{localized(variant.translations, locale)}</option>)}
                  </select>
                </label>
                {product.options.map((option) => (
                  <label className="form-field" key={option.id}>
                    <span>{localized(option.translations, locale)}</span>
                    <select
                      onChange={(event) => { setOptions((current) => ({ ...current, [option.code]: event.target.value })); setPrice(null); }}
                      required={option.is_required}
                      value={options[option.code] ?? ""}
                    >
                      {option.values.map((value) => <option key={value.value} value={value.value}>{localized(value.labels, locale)}</option>)}
                    </select>
                  </label>
                ))}
                <label className="form-field">
                  <span>{text.quantity}</span>
                  <input max={100000} min={1} name="quantity" onChange={(event) => { setQuantity(Number(event.target.value)); setPrice(null); }} required type="number" value={quantity} />
                </label>
                {price?.status === "priced" && <p className="price-result">{text.price} : <strong>{price.total_price} TND</strong></p>}
                {price?.status === "quote_required" && <p className="quote-hint">{text.noPrice}</p>}
              </section>
              <section className="product-customer">
                <h2>{text.customer}</h2>
                <label className="form-field"><span>{text.name}</span><input autoComplete="name" maxLength={160} minLength={2} name="full_name" required /></label>
                <label className="form-field"><span>{text.phone}</span><input autoComplete="tel" maxLength={40} minLength={7} name="phone" required type="tel" /></label>
                <label className="form-field"><span>{text.email}</span><input autoComplete="email" maxLength={254} name="email" type="email" /></label>
                <label className="whatsapp-consent"><input name="whatsapp_opt_in" type="checkbox" /><span>{text.whatsappConsent}</span></label>
                <label className="form-field"><span>{text.file}</span><input accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,application/pdf,image/png,image/jpeg,image/tiff" name="print_file" required={submissionChannel === "team" && price?.status === "priced" && fulfillment === "pickup"} type="file" /></label>
                <fieldset className="fulfillment-field">
                  <legend>{text.fulfillment}</legend>
                  <label><input checked={fulfillment === "pickup"} onChange={() => { setFulfillment("pickup"); setPrice(null); }} type="radio" value="pickup" />{text.pickup}</label>
                  <label><input checked={fulfillment === "delivery"} onChange={() => { setFulfillment("delivery"); setPrice(null); }} type="radio" value="delivery" />{text.delivery}</label>
                </fieldset>
                {fulfillment === "delivery" && (
                  <label className="form-field"><span>{text.address}</span><textarea autoComplete="street-address" maxLength={1000} minLength={10} name="delivery_address" required rows={3} /></label>
                )}
                <label className="form-field"><span>{text.notes}</span><textarea maxLength={2000} name="notes" rows={3} /></label>
                <fieldset className="fulfillment-field submission-method">
                  <legend>{text.channel}</legend>
                  <label>
                    <input checked={submissionChannel === "team"} name="submission_channel" onChange={() => { setSubmissionChannel("team"); setWhatsAppUrl(""); setSuccess(""); }} type="radio" value="team" />
                    <span><strong>{text.team}</strong><small>{text.teamDescription}</small></span>
                  </label>
                  <label>
                    <input checked={submissionChannel === "whatsapp"} name="submission_channel" onChange={() => { setSubmissionChannel("whatsapp"); setWhatsAppUrl(""); setSuccess(""); }} type="radio" value="whatsapp" />
                    <span><strong>{text.whatsapp}</strong><small>{text.whatsappDescription}</small></span>
                  </label>
                </fieldset>
                <p className="payment-note">{text.payment}</p>
                {error && <p className="form-error" role="alert">{error}</p>}
                {success && <p className="form-success" role="status">{success}</p>}
                {whatsAppUrl && <a className="button button-outline whatsapp-fallback" href={whatsAppUrl} rel="noreferrer" target="_blank">{text.whatsappOpen}<span aria-hidden="true">↗</span></a>}
                <button className="button button-dark" disabled={busy || Boolean(success)} type="submit">
                  {submissionChannel === "whatsapp" ? text.whatsapp : busy ? "…" : !price ? text.checkPrice : price.status === "priced" && fulfillment === "pickup" ? text.order : text.quote}
                  <span aria-hidden="true">↗</span>
                </button>
              </section>
            </form>
          </>
        )}
      </div>
      <SiteFooter locale={locale} />
    </main>
  );
}
