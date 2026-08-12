import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm text-canvas-900 placeholder:text-canvas-600/60 focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200 ${className}`}
      {...props}
    />
  );
}
