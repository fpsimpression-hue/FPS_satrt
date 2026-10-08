"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { apiRequest, type Locale, type Product } from "@/lib/api";
import { localCatalogueProducts } from "@/lib/local-catalog";
import { highlightParts } from "@/lib/search";
import { buildSiteIndex, kindLabels, searchSite, type SiteResult } from "@/lib/site-search";

const labels = {
  fr: { placeholder: "Rechercher…", open: "Rechercher sur le site", clear: "Effacer", close: "Fermer la recherche", empty: "Aucun résultat.", quote: "Demander un devis" },
  ar: { placeholder: "ابحث…", open: "البحث في الموقع", clear: "مسح", close: "إغلاق البحث", empty: "لا توجد نتائج.", quote: "اطلبوا عرض سعر" },
  en: { placeholder: "Search…", open: "Search the site", clear: "Clear", close: "Close search", empty: "No results.", quote: "Request a quote" },
} as const;

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/** Search field that lives in the navigation bar; results open right below it while typing. */
export function SiteSearch({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const text = labels[locale];

  function openField() {
    setExpanded(true);
    setFocused(true);
    inputRef.current?.focus();
  }

  // On small screens the field is hidden until opened, so focus it once it is displayed.
  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  function close() {
    setFocused(false);
    setExpanded(false);
    setActive(0);
    inputRef.current?.blur();
  }

  useEffect(() => {
    const shortcut = (event: globalThis.KeyboardEvent) => {
      const wantsSearch = ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") || (event.key === "/" && !isTypingTarget(event.target));
      if (wantsSearch) {
        event.preventDefault();
        openField();
      }
    };
    const clickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setFocused(false);
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", shortcut);
    document.addEventListener("mousedown", clickOutside);
    return () => {
      window.removeEventListener("keydown", shortcut);
      document.removeEventListener("mousedown", clickOutside);
    };
  }, []);

  useEffect(() => {
    if (!focused || products) return;
    let cancelled = false;
    // The catalogue is only loaded the first time someone uses the search.
    apiRequest<Product[]>("/catalog/products")
      .then((result) => { if (!cancelled) setProducts(result); })
      .catch(() => { if (!cancelled) setProducts(localCatalogueProducts); });
    return () => {
      cancelled = true;
    };
  }, [focused, products]);

  const index = useMemo(() => buildSiteIndex(locale, products ?? []), [locale, products]);
  const trimmed = query.trim();
  const results = useMemo(() => (trimmed ? searchSite(index, trimmed) : []), [index, trimmed]);
  const showResults = focused && trimmed.length > 0;

  function go(result: SiteResult) {
    close();
    setQuery("");
    if (result.external) window.open(result.href, "_blank", "noopener,noreferrer");
    else window.location.assign(result.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (query) setQuery("");
      else close();
    } else if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setActive((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActive((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active]);
    }
  }

  return (
    <div className={expanded ? "site-search is-expanded" : "site-search"} ref={rootRef} role="search">
      <button aria-label={text.open} className="site-search-toggle" onClick={openField} type="button">
        <SearchIcon />
      </button>
      <div className="site-search-box" onClick={() => inputRef.current?.focus()}>
        <SearchIcon />
        <input
          aria-activedescendant={showResults && results.length ? `site-search-option-${active}` : undefined}
          aria-autocomplete="list"
          aria-controls="site-search-results"
          aria-expanded={showResults}
          aria-label={text.open}
          autoComplete="off"
          enterKeyHint="search"
          onChange={(event) => { setQuery(event.target.value); setActive(0); }}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder={text.placeholder}
          ref={inputRef}
          role="combobox"
          spellCheck={false}
          type="text"
          value={query}
        />
        {query && (
          <button aria-label={text.clear} className="site-search-clear" onClick={() => { setQuery(""); inputRef.current?.focus(); }} type="button">×</button>
        )}
        <button aria-label={text.close} className="site-search-cancel" onClick={close} type="button">×</button>
      </div>

      {showResults && (
        <div className="site-search-results" id="site-search-results" role="listbox" aria-label={text.open}>
          {results.map((result, position) => (
            <a
              aria-selected={position === active}
              className={position === active ? "site-search-item is-active" : "site-search-item"}
              href={result.href}
              id={`site-search-option-${position}`}
              key={result.id}
              onClick={(event) => { event.preventDefault(); go(result); }}
              onMouseEnter={() => setActive(position)}
              role="option"
              tabIndex={-1}
            >
              <span className="site-search-thumb">
                {result.image ? <Image alt="" fill sizes="36px" src={result.image} unoptimized={result.image.startsWith("http")} /> : <SearchIcon />}
              </span>
              <span className="site-search-title">
                {highlightParts(result.title, trimmed).map((part, partIndex) => (part.match ? <mark key={partIndex}>{part.text}</mark> : <span key={partIndex}>{part.text}</span>))}
              </span>
              <span className="site-search-kind">{kindLabels[locale][result.kind]}</span>
            </a>
          ))}
          {results.length === 0 && (
            <p className="site-search-empty">
              {text.empty} <a href={`/devis?lang=${locale}`}>{text.quote} →</a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
