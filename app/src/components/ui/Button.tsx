import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type Variant = "primary" | "accent" | "secondary" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-leaf-800 text-white hover:bg-leaf-700 active:bg-leaf-900",
  accent: "bg-turmeric-400 text-ink hover:bg-turmeric-300 active:bg-turmeric-500",
  secondary: "bg-white text-leaf-800 ring-1 ring-inset ring-leaf-800/30 hover:bg-leaf-50",
  ghost: "text-leaf-800 hover:bg-leaf-50",
};

const SIZES: Record<Size, string> = {
  md: "min-h-[48px] px-5 text-base",
  lg: "min-h-[56px] px-6 text-lg",
};

function classes(variant: Variant, size: Size, block: boolean, extra = "") {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    block ? "w-full" : "",
    extra,
  ].join(" ");
}

type Common = { variant?: Variant; size?: Size; block?: boolean; children: ReactNode };

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  className,
  type = "button",
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={classes(variant, size, block, className)} {...rest} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  block = false,
  className,
  ...rest
}: Common & LinkProps) {
  return <Link className={classes(variant, size, block, className)} {...rest} />;
}
