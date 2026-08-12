import type { SVGProps } from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function IconStore(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 9.5 4.5 4h15L21 9.5" />
      <path d="M3.5 9.5v9A1.5 1.5 0 0 0 5 20h14a1.5 1.5 0 0 0 1.5-1.5v-9" />
      <path d="M9 20v-5.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V20" />
      <path d="M3.5 9.5a2.5 2.5 0 0 0 5 0M8.5 9.5a2.5 2.5 0 0 0 5 0M13.5 9.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

export function IconTasks(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="m8.5 12 2 2 4.5-4.5" />
    </svg>
  );
}

export function IconInspection(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m19.5 19.5-4.2-4.2" />
      <path d="m8 10.5 1.8 1.8L13.5 8" />
    </svg>
  );
}

export function IconInventory(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 7.5 12 3l8.5 4.5L12 12 3.5 7.5Z" />
      <path d="M3.5 7.5V16l8.5 4.5V12" />
      <path d="M20.5 7.5V16L12 20.5" />
    </svg>
  );
}

export function IconBuilding(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="3" width="9" height="18" rx="1" />
      <rect x="14" y="8" width="5" height="13" rx="1" />
      <path d="M8 7h.01M11 7h.01M8 11h.01M11 11h.01M8 15h.01M11 15h.01" />
    </svg>
  );
}

export function IconWallet(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M15.5 14.5h2" />
    </svg>
  );
}

export function IconMapPin(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.25" />
    </svg>
  );
}

export function IconLock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
