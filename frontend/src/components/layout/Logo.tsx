import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  variant?: "lockup" | "icon";
  size?: number;
  href?: string;
  textClassName?: string;
};

export function Logo({
  variant = "lockup",
  size = 40,
  href = "/",
  textClassName = "text-xl font-bold font-heading text-fg-default",
}: LogoProps) {
  const content = (
    <span className="flex items-center gap-3">
      <Image
        src="/logo-light.png"
        alt="LARISIN"
        width={size}
        height={size}
        priority
      />
      {variant === "lockup" ? (
        <span className={textClassName}>LARISIN</span>
      ) : null}
    </span>
  );

  return (
    <Link href={href} className="inline-flex items-center" aria-label="LARISIN">
      {content}
    </Link>
  );
}
