type Locale = "fr" | "ar" | "en";

const content = {
  fr: { cta: "Demander un devis", secondary: "Voir le catalogue" },
  ar: { cta: "اطلبوا عرض سعر", secondary: "تصفحوا المنتجات" },
  en: { cta: "Request a quote", secondary: "Browse the catalogue" },
} as const;

type Step = readonly [number: string, title: string, description: string];

export function ServiceOrbit({
  locale,
  eyebrow,
  title,
  intro,
  steps,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  intro: string;
  steps: readonly Step[];
}) {
  const text = content[locale];

  return (
    <section id="service-orbit" className="service-orbit-section" aria-labelledby="service-orbit-title">
      <p className="eyebrow"><span />{eyebrow}</p>
      <h2 id="service-orbit-title">{title}</h2>
      <p className="service-orbit-intro">{intro}</p>
      <div className="service-journey">
        <ol className="service-journey-grid">
          {steps.map(([number, stepTitle, description]) => (
            <li className="service-journey-step" key={number}>
              <span className="service-journey-number" aria-hidden="true">{number}</span>
              <div className="service-journey-copy">
                <h3>{stepTitle}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="service-orbit-actions">
        <a className="button button-dark service-orbit-cta" href={`/devis?lang=${locale}`}>
          {text.cta}<span aria-hidden="true">↗</span>
        </a>
        <a className="text-link" href={`/catalogue?lang=${locale}`}>
          {text.secondary}<span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
