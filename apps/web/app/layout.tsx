import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fast Print Sahline | L’impression qui vous ressemble",
  description:
    "Impression et publicité à Sahline, Monastir : cartes de visite, flyers, affiches, textiles et objets personnalisés. Demandez votre devis à Fast Print Sahline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
