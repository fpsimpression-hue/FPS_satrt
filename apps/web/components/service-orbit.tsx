import { useEffect, useRef, useState } from "react";

type Locale = "fr" | "ar" | "en";

const content = {
  fr: {
    eyebrow: "De l’idée au produit fini",
    title: "Toutes vos idées prennent forme.",
    intro: "Un seul atelier pour vos impressions papier, textiles et grand format, du conseil à la livraison.",
    items: ["Papier", "Textile", "Grand format", "Personnalisation", "Devis", "Livraison"],
    cta: "Découvrir nos services",
  },
  ar: {
    eyebrow: "من الفكرة إلى المنتج النهائي",
    title: "نحوّل أفكاركم إلى واقع.",
    intro: "ورشة واحدة لطباعة الورق والمنسوجات والكبير الحجم، من الاستشارة إلى التوصيل.",
    items: ["الورق", "المنسوجات", "الطباعة الكبيرة", "التخصيص", "عرض سعر", "التوصيل"],
    cta: "اكتشفوا خدماتنا",
  },
  en: {
    eyebrow: "From idea to finished print",
    title: "One place for all your ideas.",
    intro: "One print studio for paper, textiles and large format, from advice through delivery.",
    items: ["Paper", "Textile", "Large format", "Custom work", "Quotes", "Delivery"],
    cta: "Explore our services",
  },
} as const;

const symbols = ["▤", "◫", "▱", "✳", "TND", "↗"];

export function ServiceOrbit({ locale }: { locale: Locale }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(false);
  const text = content[locale];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setIsActive(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="service-orbit" ref={sectionRef} className={isActive ? "service-orbit-section is-active" : "service-orbit-section"} aria-labelledby="service-orbit-title">
      <p className="eyebrow"><span />{text.eyebrow}</p>
      <h2 id="service-orbit-title">{text.title}</h2>
      <p className="service-orbit-intro">{text.intro}</p>
      <div className="service-orbit" aria-label={text.items.join(", ")}>
        <div className="service-orbit-ring" aria-hidden="true" />
        <div className="service-orbit-core">
          <span className="service-orbit-core-mark">FPS</span>
          <span className="service-orbit-core-caption">FAST PRINT · SAHLINE</span>
        </div>
        <div className="service-orbit-rotator">
          {text.items.map((item, index) => (
            <div className={`service-orbit-node service-orbit-node-${index + 1}`} key={item}>
              <div className="service-orbit-node-face">
                <span className="service-orbit-node-icon" aria-hidden="true">{symbols[index]}</span>
                <span>{item}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <a className="button button-dark service-orbit-cta" href={`/catalogue?lang=${locale}`}>
        {text.cta}<span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
