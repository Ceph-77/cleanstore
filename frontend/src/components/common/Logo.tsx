export function Logo({ size = "md", inverted = false }: { size?: "sm" | "md" | "lg"; inverted?: boolean }) {
  const dims = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-12 w-12" }[size];
  const textSize = { sm: "text-sm", md: "text-lg", lg: "text-2xl" }[size];

  return (
    <div className="flex items-center gap-2.5">
      <span className={`relative block ${dims} shrink-0`}>
        <span className="absolute inset-0 rotate-6 rounded-md bg-linen-300" />
        <span className="absolute inset-0 -rotate-6 rounded-md bg-flow-500" />
      </span>
      <span className={`font-heading ${textSize} font-semibold tracking-tight ${inverted ? "text-white" : "text-canvas-900"}`}>
        KLEAN<span className={inverted ? "text-linen-300" : "text-flow-600"}>'</span>STOR
      </span>
    </div>
  );
}
