import { Brand } from "@/components/brand";

type SiteFooterProps = { locale?: "fr" | "ar" | "en" };

const labels = {
  fr: {
    phone: "Appelez-nous", email: "Écrivez-nous", location: "Atelier", whatsappContact: "Nous contacter sur WhatsApp",
    project: "Parlons de votre projet", title: "Une idée à imprimer ?",
    body: "Décrivez-nous le support souhaité, la quantité et les finitions envisagées. Nous étudierons votre demande.",
    about: "À propos", links: "Liens utiles", support: "Assistance", contact: "Contact",
    services: "Services", catalogue: "Catalogue", gallery: "Réalisations", pricing: "Tarifs", faq: "Questions fréquentes",
    quote: "Demander un devis", admin: "Espace équipe", socials: "Suivez-nous",
    city: "Sahline, Monastir, Tunisie", description: "Atelier d’impression à Sahline : papier, textile et grand format, du devis à la livraison.",
    copyright: "Tous droits réservés.",
  },
  ar: {
    phone: "اتصلوا بنا", email: "راسلونا", location: "الورشة", whatsappContact: "تواصلوا معنا عبر واتساب",
    project: "لنتحدث عن مشروعكم", title: "لديكم فكرة للطباعة؟",
    body: "أخبرونا عن المنتج والكمية والتشطيبات المطلوبة لندرس طلبكم.",
    about: "من نحن", links: "روابط مفيدة", support: "المساعدة", contact: "اتصلوا بنا",
    services: "خدماتنا", catalogue: "المنتجات", gallery: "أعمالنا", pricing: "الأسعار", faq: "الأسئلة الشائعة",
    quote: "طلب عرض سعر", admin: "مساحة الفريق", socials: "تابعونا",
    city: "الساحلين، المنستير، تونس", description: "ورشة طباعة في الساحلين: الورق والمنسوجات والطباعة كبيرة الحجم، من عرض السعر إلى التسليم.",
    copyright: "جميع الحقوق محفوظة.",
  },
  en: {
    phone: "Call us", email: "Email us", location: "Workshop", whatsappContact: "Contact us on WhatsApp",
    project: "Tell us about your project", title: "Have an idea to print?",
    body: "Tell us what you need, the quantity and any finishes you have in mind. We will review your request.",
    about: "About Us", links: "Useful Links", support: "Support", contact: "Contact Us",
    services: "Services", catalogue: "Catalogue", gallery: "Our work", pricing: "Pricing", faq: "Frequently asked questions",
    quote: "Request a quote", admin: "Team workspace", socials: "Follow us",
    city: "Sahline, Monastir, Tunisia", description: "Print studio in Sahline for paper, textile and large format, from quote to delivery.",
    copyright: "All rights reserved.",
  },
} as const;

function ContactIcon({ kind }: { kind: "phone" | "email" | "location" }) {
  const paths = {
    phone: <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.56 1 1 0 0 1-.25 1Z" />,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill={kind === "phone" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}

function SocialIcon({ name }: { name: "Facebook" | "X" | "Instagram" | "LinkedIn" }) {
  if (name === "Facebook") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.2H7.6V13h2.7v8z" /></svg>;
  if (name === "X") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18.9 3H22l-6.8 7.8L23.2 21h-6.3L12 14.7 6.4 21H3.2l7.3-8.4L2.8 3h6.5l4.4 5.8zm-1.1 16h1.7L8.2 4.9H6.4z" /></svg>;
  if (name === "Instagram") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 3.8A2.2 2.2 0 1 1 5 8.2a2.2 2.2 0 0 1 0-4.4ZM3.2 9.8h3.6V21H3.2zm5.8 0h3.5v1.5h.1a3.8 3.8 0 0 1 3.4-1.8c3.6 0 4.3 2.4 4.3 5.5V21h-3.6v-5.3c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V21H9z" /></svg>;
}

export function SiteFooter({ locale = "fr" }: SiteFooterProps) {
  const text = labels[locale];
  const socialProfiles = { Facebook: "https://www.facebook.com/p/Fast-Print-Sahline-Page-100054267831226/" } as const;
  const mapsQuery = encodeURIComponent("Fast Print, QP37+6VJ, Sahline, Tunisia");
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const mapsEmbed = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;

  return (
    <>
    <footer className="site-footer" dir={locale === "ar" ? "rtl" : "ltr"}>
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
          <a className="contact-card contact-location" href={mapsLink} target="_blank" rel="noreferrer">
            <span aria-hidden="true">⌖</span>
            <small>{text.location}</small>
            <strong>{text.city}</strong>
          </a>
        </div>
        <div className="contact-map">
          <iframe src={mapsEmbed} title={`Google Maps — ${text.city}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </section>

      <div className="footer-main">
        <div className="footer-column footer-brand-column">
          <Brand footer href={`/?lang=${locale}`} locale={locale} />
          <p className="footer-description">{text.description}</p>
          <div className="footer-social-block">
            <h2>{text.socials}</h2>
            <div className="footer-socials" aria-label={text.socials}>
              {(["Facebook", "X", "Instagram", "LinkedIn"] as const).map((name) => (
                name === "Facebook" ? (
                  <a aria-label={name} className="footer-social-icon" href={socialProfiles.Facebook} key={name} rel="noreferrer" target="_blank" title={name}>
                    <SocialIcon name={name} />
                  </a>
                ) : (
                  <span aria-label={name} className="footer-social-icon" key={name} role="img" title={name}>
                    <SocialIcon name={name} />
                  </span>
                )
              ))}
            </div>
          </div>
        </div>

        <nav className="footer-column" aria-label={text.links}>
          <h2>{text.links}</h2>
          <a href={`/?lang=${locale}#about-us`}>{text.about}</a>
          <a href={`/services?lang=${locale}`}>{text.services}</a>
          <a href={`/catalogue?lang=${locale}`}>{text.catalogue}</a>
          <a href={`/realisations?lang=${locale}`}>{text.gallery}</a>
          <a href={`/?lang=${locale}#tarifs`}>{text.pricing}</a>
        </nav>

        <nav className="footer-column" aria-label={text.support}>
          <h2>{text.support}</h2>
          <a href={`/faq?lang=${locale}`}>{text.faq}</a>
          <a href={`/devis?lang=${locale}`}>{text.quote}</a>
          <a href="/admin">{text.admin}</a>
        </nav>

        <div className="footer-column footer-contact-column">
          <h2>{text.contact}</h2>
          <a href="tel:+21623267178"><span><ContactIcon kind="phone" /></span><b dir="ltr">+216 23 267 178</b></a>
          <a href="mailto:fps.impression@gmail.com"><span><ContactIcon kind="email" /></span><b dir="ltr">fps.impression@gmail.com</b></a>
          <a href={mapsLink} target="_blank" rel="noreferrer"><span><ContactIcon kind="location" /></span><b>{text.city}</b></a>
        </div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Fast Print Sahline</span><span>{text.copyright}</span></div>
    </footer>
    <a aria-label={text.whatsappContact} className="whatsapp-float" href="https://wa.me/21623267178" rel="noreferrer" target="_blank" title={text.whatsappContact}>
      <svg aria-hidden="true" viewBox="0 0 32 32" fill="none">
        <path d="M26.5 15.5a10.5 10.5 0 0 1-15.55 9.18L5 26l1.38-5.73A10.5 10.5 0 1 1 26.5 15.5Z" />
        <path d="M11.2 10.3c.3-.68.62-.7 1.02-.71h.87c.28 0 .59.1.77.52l1.1 2.56c.14.34.14.6-.04.86l-.82 1c-.23.26-.3.46-.1.8a9.2 9.2 0 0 0 2.02 2.48 8.8 8.8 0 0 0 2.65 1.63c.33.15.53.12.74-.13l1.07-1.26c.25-.29.5-.35.83-.22l2.46 1.17c.36.17.6.26.69.42.1.17.1.97-.24 1.86-.34.89-1.96 1.74-2.7 1.8-.74.07-1.44.34-4.85-1.08-4.1-1.7-6.72-5.95-6.92-6.23-.2-.28-1.65-2.2-1.65-4.2 0-2 .97-2.98 1.32-3.37Z" />
      </svg>
    </a>
    </>
  );
}
