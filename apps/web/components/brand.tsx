import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  href: string;
  locale?: string;
  footer?: boolean;
};

export function Brand({ href, footer = false }: BrandProps) {
  return (
    <Link aria-label="Fast Print Sahline" className={footer ? "brand brand-footer" : "brand"} href={href}>
      <Image
        alt=""
        aria-hidden="true"
        className="brand-logo"
        height={740}
        src={footer ? "/fast-print-sahline-light.svg" : "/fast-print-sahline.svg"}
        width={1826}
      />
    </Link>
  );
}
