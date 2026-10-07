type Locale = "fr" | "ar" | "en";

const content = {
  fr: { cta: "Découvrir nos services" },
  ar: { cta: "اكتشفوا خدماتنا" },
  en: { cta: "Explore our services" },
} as const;

type Step = readonly [number: string, title: string, description: string];

function StepIllustration({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 150 120" aria-hidden="true">
        <path d="M12 24h44v61H12z" fill="#fff" stroke="#d5dfe8" strokeWidth="3" />
        <path d="m20 34 28 6M20 45l22 5M20 57l25 5" stroke="#1684f8" strokeWidth="5" strokeLinecap="round" />
        <path d="M75 35h53v58H75z" fill="#fff" stroke="#f01255" strokeWidth="3" />
        <path d="M82 46h39M82 57h31M82 68h35M82 79h25" stroke="#f7a8c2" strokeWidth="4" strokeLinecap="round" />
        <path d="M42 95h87" stroke="#f28b00" strokeWidth="7" strokeLinecap="round" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg viewBox="0 0 150 120" aria-hidden="true">
        <path d="M42 12h49l22 22v72H42z" fill="#fff" stroke="#d5dfe8" strokeWidth="3" />
        <path d="M91 12v23h22" fill="#eef7ff" stroke="#d5dfe8" strokeWidth="3" />
        <path d="M58 54h38M58 67h29" stroke="#9aabba" strokeWidth="6" strokeLinecap="round" />
        <circle cx="102" cy="87" r="26" fill="#1684f8" />
        <path d="M102 101V73m-12 12 12-12 12 12" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (index === 2) {
    return (
      <svg viewBox="0 0 150 120" aria-hidden="true">
        <path d="M29 13h64l22 22v72H29z" fill="#fff" stroke="#d5dfe8" strokeWidth="3" />
        <path d="M93 13v23h22" fill="#fff7e8" stroke="#d5dfe8" strokeWidth="3" />
        <path d="M46 53h46M46 67h35M46 81h29" stroke="#9aabba" strokeWidth="6" strokeLinecap="round" />
        <circle cx="101" cy="88" r="25" fill="#0aa65a" />
        <path d="m89 88 8 8 16-18" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 150 120" aria-hidden="true">
      <path d="M13 47h75v48H13z" fill="#f4b26d" stroke="#d28c46" strokeWidth="3" />
      <path d="m13 47 37-20 38 20-37 20z" fill="#ffd49d" stroke="#d28c46" strokeWidth="3" />
      <path d="M50 67v28M31 37l38 20M69 37 31 57" stroke="#fff1dc" strokeWidth="5" />
      <path d="M88 60h25l18 18v17H88z" fill="#fff" stroke="#64798b" strokeWidth="3" />
      <path d="M113 61v19h18" fill="#eaf4fb" stroke="#64798b" strokeWidth="3" />
      <circle cx="101" cy="96" r="7" fill="#253746" />
      <circle cx="120" cy="96" r="7" fill="#253746" />
    </svg>
  );
}

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
      <div className="service-journey" aria-label={title}>
        <svg className="service-journey-road" viewBox="0 0 1000 440" preserveAspectRatio="none" aria-hidden="true">
          <path className="service-journey-road-edge service-journey-road-desktop" d="M 10 105 C 165 105 150 330 330 330 S 405 105 565 105 S 690 330 820 330 S 890 105 990 105" />
          <path className="service-journey-road-fill service-journey-road-desktop" d="M 10 105 C 165 105 150 330 330 330 S 405 105 565 105 S 690 330 820 330 S 890 105 990 105" />
          <path className="service-journey-road-center service-journey-road-desktop" d="M 10 105 C 165 105 150 330 330 330 S 405 105 565 105 S 690 330 820 330 S 890 105 990 105" />
          <path className="service-journey-road-edge service-journey-road-mobile" d="M 500 0 C 390 55 610 75 500 110 S 390 170 500 220 S 610 290 500 330 S 390 385 500 440" />
          <path className="service-journey-road-fill service-journey-road-mobile" d="M 500 0 C 390 55 610 75 500 110 S 390 170 500 220 S 610 290 500 330 S 390 385 500 440" />
          <path className="service-journey-road-center service-journey-road-mobile" d="M 500 0 C 390 55 610 75 500 110 S 390 170 500 220 S 610 290 500 330 S 390 385 500 440" />
        </svg>
        <div className="service-journey-grid">
          {steps.map(([number, stepTitle, description], index) => (
            <article className={`service-journey-step service-journey-step-${index + 1}`} key={number}>
              <span className="service-journey-number">{number}</span>
              <span className="service-journey-icon"><StepIllustration index={index} /></span>
              <div className="service-journey-copy">
                <h3>{stepTitle}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <a className="button button-dark service-orbit-cta" href={`/catalogue?lang=${locale}`}>
        {text.cta}<span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
