import { Brand } from "@/components/brand";

type SiteFooterProps = { locale?: "fr" | "ar" | "en" };

const labels = {
  fr: {
    phone: "Appelez-nous", email: "Écrivez-nous", location: "Atelier",
    project: "Parlons de votre projet", faq: "FAQ", title: "Une idée à imprimer ?",
    body: "Décrivez-nous le support souhaité, la quantité et les finitions envisagées. Nous pourrons étudier votre demande.",
    admin: "Espace équipe", city: "Sahline, Monastir, Tunisie",
    tagline: "Impression soignée. Idées sans limites.",
  },
  ar: {
    phone: "اتصلوا بنا", email: "راسلونا", location: "الورشة",
    project: "لنتحدث عن مشروعكم", faq: "الأسئلة الشائعة", title: "لديكم فكرة للطباعة؟",
    body: "أخبرونا عن المنتج والكمية والتشطيبات المطلوبة لندرس طلبكم.",
    admin: "مساحة الفريق", city: "الساحلين، المنستير، تونس",
    tagline: "طباعة متقنة. أفكار بلا حدود.",
  },
  en: {
    phone: "Call us", email: "Email us", location: "Workshop",
    project: "Tell us about your project", faq: "FAQ", title: "Have an idea to print?",
    body: "Tell us what you need, how many you need and any finishes you have in mind. We can review your request.",
    admin: "Team workspace", city: "Sahline, Monastir, Tunisia",
    tagline: "Thoughtful printing. Ideas without limits.",
  },
} as const;

export function SiteFooter({ locale = "fr" }: SiteFooterProps) {
  const text = labels[locale];

  return (
    <footer className="site-footer">
      <section className="contact footer-contact-section section-wrap" id="contact">
        <div className="contact-copy">
          <p className="eyebrow"><span />{text.project}</p>
          <h2>{text.title}</h2>
          <p>{text.body}</p>
        </div>
        <div className="contact-cards">
          <a className="contact-card" href="tel:+21623267178">
            <span aria-hidden="true">↗</span>
            <small>{text.phone}</small>
            <strong dir="ltr">+216 23 267 178</strong>
          </a>
          <a className="contact-card" href="mailto:fps.impression@gmail.com">
            <span aria-hidden="true">@</span>
            <small>{text.email}</small>
            <strong dir="ltr">fps.impression@gmail.com</strong>
          </a>
          <div className="contact-card contact-location">
            <span aria-hidden="true">⌖</span>
            <small>{text.location}</small>
            <strong>{text.city}</strong>
          </div>
        </div>
      </section>
      <div className="footer-lower">
        <div className="footer-brand">
          <Brand footer href={`/?lang=${locale}`} locale={locale} />
          <p className="footer-description">
            Imprimerie à Sahline, Monastir, papier, textile et grand format, du devis à la livraison.
          </p>
        </div>
        <p className="footer-tagline">{text.tagline}</p>
        <a className="footer-contact" href="#contact">{text.project}</a>
        <a className="footer-faq" href={`/faq?lang=${locale}`}>{text.faq}</a>
        <a className="admin-entry" href="/admin">{text.admin}</a>
        <span>© {new Date().getFullYear()} Fast Print Sahline</span>
      </div>
    </footer>
  );
}
