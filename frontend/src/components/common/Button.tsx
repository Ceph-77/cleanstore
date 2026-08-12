import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-flow-600 text-white hover:bg-flow-700 shadow-sm shadow-flow-900/10",
  secondary: "bg-white text-canvas-800 border border-canvas-300 hover:bg-canvas-50",
  accent: "bg-linen-400 text-linen-900 hover:bg-linen-500 shadow-sm shadow-linen-900/10",
  danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50",
  ghost: "text-canvas-700 hover:bg-canvas-100",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
