export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect width="512" height="512" rx="112" fill="#2d5871" />
      <g
        stroke="#fdfcf9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M186 150 V366" strokeWidth="42" />
        <path d="M186 258 L330 150" strokeWidth="42" />
        <path d="M186 258 L250 328" strokeWidth="42" />
        <g strokeWidth="15">
          <path d="M234 322 L214 392" />
          <path d="M250 328 L252 396" />
          <path d="M266 332 L292 390" />
          <path d="M280 340 L324 376" />
        </g>
        <path d="M206 396 Q 268 416 332 384" strokeWidth="12" opacity="0.5" />
      </g>
      <circle cx="208" cy="252" r="17" fill="#e3a94c" />
    </svg>
  );
}

export function Logo({ size = "md", inverted = false }: { size?: "sm" | "md" | "lg"; inverted?: boolean }) {
  const dims = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-12 w-12" }[size];
  const textSize = { sm: "text-sm", md: "text-lg", lg: "text-2xl" }[size];

  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className={`${dims} shrink-0`} />
      <span
        className={`font-heading ${textSize} font-semibold tracking-tight ${
          inverted ? "text-white" : "text-canvas-900"
        }`}
      >
        KLEAN<span className={inverted ? "text-linen-300" : "text-flow-600"}>'</span>STOR
      </span>
    </div>
  );
}
