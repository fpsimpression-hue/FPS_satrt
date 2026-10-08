import Image from "next/image";

export type Partner = {
  name: string;
  logo: string;
  crop: readonly [sourceWidth: number, sourceHeight: number, x: number, y: number, width: number, height: number];
};

/** Clients whose logos we show; each crop frames the logo inside its source image. */
export const partners: Partner[] = [
  { name: "Wafacash", logo: "/partners/wafacash.webp", crop: [139, 164, 0, 58, 138, 48] },
  { name: "AMED Groupe", logo: "/partners/amed-groupe.webp", crop: [180, 119, 10, 6, 162, 106] },
  { name: "Lambda Collège & Lycée", logo: "/partners/lambda.webp", crop: [156, 164, 10, 6, 132, 140] },
  { name: "Alsico", logo: "/partners/alsico.webp", crop: [180, 101, 0, 0, 178, 100] },
  { name: "SOMA", logo: "/partners/soma.jpg", crop: [180, 94, 26, 34, 130, 26] },
  { name: "Zoppas Industries", logo: "/partners/zoppas-industries.webp", crop: [180, 49, 8, 8, 162, 32] },
  { name: "Retro Fish", logo: "/partners/retro-fish.webp", crop: [180, 108, 6, 4, 170, 102] },
  { name: "Centre International Carthage Medical", logo: "/partners/centre-international-carthage-medical.webp", crop: [180, 158, 22, 18, 140, 118] },
  { name: "Flormar", logo: "/partners/flormar.webp", crop: [180, 46, 0, 0, 178, 44] },
  { name: "Sahara Beach Aquapark Resort", logo: "/partners/sahara-beach.webp", crop: [180, 114, 36, 6, 108, 102] },
  { name: "ONE Hotels & Resorts", logo: "/partners/one-hotels-resorts.webp", crop: [180, 180, 0, 42, 168, 92] },
  { name: "Skylla", logo: "/partners/skylla.webp", crop: [180, 56, 0, 0, 178, 54] },
  { name: "SEWS-TN", logo: "/partners/sews-tn.jpg", crop: [170, 151, 12, 12, 148, 120] },
];

export function PartnerLogo({ partner, maxWidth = 145, maxHeight = 58 }: { partner: Partner; maxWidth?: number; maxHeight?: number }) {
  const [sourceWidth, sourceHeight, x, y, cropWidth, cropHeight] = partner.crop;
  const scale = Math.min(maxWidth / cropWidth, maxHeight / cropHeight);
  return (
    <div className="partner-logo-mark" style={{ width: cropWidth * scale, height: cropHeight * scale }}>
      <Image
        alt={partner.name}
        height={sourceHeight}
        sizes="180px"
        src={partner.logo}
        width={sourceWidth}
        style={{
          height: `${(sourceHeight / cropHeight) * 100}%`,
          left: `${-(x / cropWidth) * 100}%`,
          maxWidth: "none",
          objectFit: "contain",
          position: "absolute",
          top: `${-(y / cropHeight) * 100}%`,
          width: `${(sourceWidth / cropWidth) * 100}%`,
        }}
      />
    </div>
  );
}
