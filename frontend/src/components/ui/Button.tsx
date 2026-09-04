import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "surface";
type Size = "sm" | "md" | "lg";

type ButtonBaseProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

type ButtonAsButton = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof ButtonBaseProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-500 text-fg-text-contrast hover:bg-primary-400 focus-visible:ring-primary-400",
  secondary:
    "bg-secondary-400 text-fg-text-contrast hover:bg-secondary-500 focus-visible:ring-secondary-400",
  outline:
    "border border-fg-line bg-transparent text-primary-500 hover:bg-neutral-100 focus-visible:ring-primary-300",
  ghost:
    "bg-transparent text-primary-500 hover:bg-neutral-100 focus-visible:ring-primary-300",
  surface:
    "bg-primary-100 text-primary-400 hover:bg-primary-200 focus-visible:ring-primary-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-12 px-8 text-base",
};

function baseClasses(variant: Variant, size: Size, fullWidth?: boolean) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
  ].join(" ");
}

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", fullWidth, ...rest } = props;
  const classes = baseClasses(variant, size, fullWidth);

  if (rest.href !== undefined && "href" in rest) {
    const { href, children, ...anchorRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  const buttonProps = rest as ButtonAsButton;
  return (
    <button className={classes} {...buttonProps}>
      {buttonProps.children as ReactNode}
    </button>
  );
}