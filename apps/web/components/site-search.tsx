"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

import { apiRequest, type Locale, type Product } from "@/lib/api";
import { localCatalogueProducts } from "@/lib/local-catalog";
import { highlightParts } from "@/lib/search";
import { buildSiteIndex, searchGroupLabels, searchSite, type SiteResult, type SiteResultKind } from "@/lib/site-search";

const labels = {
  fr: {
    open: "Rechercher sur le site",
    placeholder: "Produit, service, question… ex. carte de visite",
    close: "Fermer la recherche",
    popular: "Recherches populaires",
    popularItems: ["Cartes de visite", "Enseigne lumineuse", "T-shirts", "Roll-up", "Trophées", "Flocage voiture"],
    shortcuts: "Raccourcis",
    noResult: (query: string) => `Aucun résultat pour « ${query} »`,
    noResultHelp: "Nous réalisons aussi les projets sur mesure : décrivez-nous votre idée.",
    quote: "Demander un devis",
    whatsapp: "Demander sur WhatsApp",
    count: (count: number) => (count > 1 ? `${count} résultats` : "1 résultat"),
    hint: "↑ ↓ pour choisir · Entrée pour ouvrir · Échap pour fermer",
    loading: "Chargement du catalogue…",
  },
  ar: {
    open: "البحث في الموقع",
    placeholder: "منتج، خدمة، سؤال… مثال: بطاقة أعمال",
    close: "إغلاق البحث",
    popular: "عمليات بحث شائعة",
    popularItems: ["بطاقات أعمال", "لافتة مضيئة", "قمصان", "رول أب", "كؤوس", "تغليف سيارة"],
    shortcuts: "اختصارات",
    noResult: (query: string) => `لا توجد نتائج لـ « ${query} »`,
    noResultHelp: "ننجز أيضاً المشاريع حسب الطلب: صفوا لنا فكرتكم.",
    quote: "اطلبوا عرض سعر",
    whatsapp: "اسألوا عبر واتساب",
    count: (count: number) => `${count} نتيجة`,
    hint: "↑ ↓ للاختيار · Enter للفتح · Esc للإغلاق",
    loading: "جارٍ تحميل الكتالوج…",
  },
  en: {
    open: "Search the site",
    placeholder: "Product, service, question… e.g. business cards",
    close: "Close search",
    popular: "Popular searches",
    popularItems: ["Business cards", "Illuminated sign", "T-shirts", "Roll-up", "Trophies", "Vehicle wrap"],
    shortcuts: "Shortcuts",
    noResult: (query: string) => `No results for “${query}”`,
    noResultHelp: "We also make custom projects: tell us about your idea.",
    quote: "Request a quote",
    whatsapp: "Ask on WhatsApp",
    count: (count: number) => (count > 1 ? `${count} results` : "1 result"),
    hint: "↑ ↓ to choose · Enter to open · Esc to close",
    loading: "Loading the catalogue…",
  },
} as const;

const shortcutIds = ["page-devis", "page-contact", "page-whatsapp", "page-realisations"];

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

function KindIcon({ kind }: { kind: SiteResultKind }) {
  const paths: Record<SiteResultKind, string> = {
    category: "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z",
    product: "M5 8h14l-1.4 11H6.4zM9 8V6a3 3 0 0 1 6 0v2",
    page: "M7 3h7l4 4v14H7zM14 3v4h4",
    faq: "M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
    work: "M4 6h16v12H4zM4 15l4-4 4 4 3-3 5 5",
  };
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d={paths[kind]} />
    </svg>
  );
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

export function SiteSearch({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const text = labels[locale];

  useEffect(() => {
    const openWithKeyboard = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", openWithKeyboard);
    return () => window.removeEventListener("keydown", openWithKeyboard);
  }, []);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => inputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || products) return;
    let cancelled = false;
    // The catalogue is only loaded the first time someone searches.
    apiRequest<Product[]>("/catalog/products")
      .then((result) => { if (!cancelled) setProducts(result); })
      .catch(() => { if (!cancelled) setProducts(localCatalogueProducts); });
    return () => {
      cancelled = true;
    };
  }, [open, products]);

  const index = useMemo(() => buildSiteIndex(locale, products ?? []), [locale, products]);
  const groups = useMemo(() => (query.trim() ? searchSite(index, query) : []), [index, query]);
  const shortcuts = useMemo(
    () => shortcutIds.flatMap((id) => index.filter((doc) => doc.item.id === id).map((doc) => doc.item)),
    [index],
  );
  const flat = query.trim() ? groups.flatMap((group) => group.results) : shortcuts;

  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function go(result: SiteResult) {
    if (result.external) {
      window.open(result.href, "_blank", "noopener,noreferrer");
      close();
      return;
    }
    close();
    window.location.assign(result.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown" && flat.length) {
      event.preventDefault();
      setActive((current) => (current + 1) % flat.length);
    } else if (event.key === "ArrowUp" && flat.length) {
      event.preventDefault();
      setActive((current) => (current - 1 + flat.length) % flat.length);
    } else if (event.key === "Enter" && flat[active]) {
      event.preventDefault();
      go(flat[active]);
    }
  }

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function highlight(value: string) {
    return highlightParts(value, query).map((part, index) => (part.match ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>));
  }

  function renderResult(result: SiteResult, index: number) {
    return (
      <div
        aria-selected={index === active}
        className={index === active ? "search-row is-active" : "search-row"}
        data-index={index}
        id={`search-option-${index}`}
        key={result.id}
        onMouseEnter={() => setActive(index)}
        role="option"
      >
        <a className="search-main" href={result.href} onClick={(event) => { event.preventDefault(); go(result); }} rel={result.external ? "noreferrer" : undefined} tabIndex={-1} target={result.external ? "_blank" : undefined}>
          <span className="search-thumb">
            {result.image ? <Image alt="" fill sizes="56px" src={result.image} unoptimized={result.image.startsWith("http")} /> : <KindIcon kind={result.kind} />}
          </span>
          <span className="search-text">
            <strong>{query.trim() ? highlight(result.title) : result.title}</strong>
            <small>{result.subtitle}</small>
          </span>
        </a>
        {result.action && (
          <a className="search-action" href={result.action.href} onClick={close} tabIndex={-1}>{result.action.label}<span aria-hidden="true"> →</span></a>
        )}
      </div>
    );
  }

  let optionIndex = -1;
  const total = flat.length;
  const whatsappHref = `https://wa.me/21623267178?text=${encodeURIComponent(query.trim())}`;

  return (
    <>
      <button aria-haspopup="dialog" aria-label={text.open} className="search-trigger" onClick={() => setOpen(true)} ref={triggerRef} title={`${text.open} (Ctrl K)`} type="button">
        <SearchIcon />
      </button>
      {open && createPortal(
        <div className="search-overlay" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div aria-label={text.open} aria-modal="true" className="search-panel" role="dialog">
            <div className="search-field">
              <SearchIcon />
              <input
                aria-activedescendant={total ? `search-option-${active}` : undefined}
                aria-autocomplete="list"
                aria-controls="search-results"
                aria-expanded={total > 0}
                autoComplete="off"
                enterKeyHint="search"
                onChange={(event) => { setQuery(event.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                placeholder={text.placeholder}
                ref={inputRef}
                role="combobox"
                spellCheck={false}
                type="search"
                value={query}
              />
              <button aria-label={text.close} className="search-close" onClick={close} type="button">Esc</button>
            </div>

            <div className="search-body" id="search-results" ref={listRef} role="listbox" aria-label={text.open}>
              {!query.trim() && (
                <>
                  <p className="search-group-title">{text.popular}</p>
                  <div className="search-chips">
                    {text.popularItems.map((item) => (
                      <button key={item} onClick={() => { setQuery(item); setActive(0); inputRef.current?.focus(); }} type="button">{item}</button>
                    ))}
                  </div>
                  <p className="search-group-title">{text.shortcuts}</p>
                  {shortcuts.map((result) => renderResult(result, (optionIndex += 1)))}
                </>
              )}

              {query.trim() && total > 0 && (
                <>
                  <p className="search-count" role="status">{text.count(total)}{!products && ` · ${text.loading}`}</p>
                  {groups.map((group) => (
                    <section className="search-group" key={group.kind}>
                      <p className="search-group-title">{searchGroupLabels[locale][group.kind]}</p>
                      {group.results.map((result) => renderResult(result, (optionIndex += 1)))}
                    </section>
                  ))}
                </>
              )}

              {query.trim() && total === 0 && (
                <div className="search-empty" role="status">
                  <strong>{text.noResult(query.trim())}</strong>
                  <p>{text.noResultHelp}</p>
                  <div>
                    <a className="search-empty-primary" href={`/devis?lang=${locale}`} onClick={close}>{text.quote}</a>
                    <a href={whatsappHref} onClick={close} rel="noreferrer" target="_blank">{text.whatsapp}</a>
                  </div>
                </div>
              )}
            </div>
            <p className="search-hint">{text.hint}</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
