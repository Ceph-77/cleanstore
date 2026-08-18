import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Logo } from "./Logo";
import { IconMenu } from "./icons";

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas-50">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-canvas-200 bg-white px-4 py-3 md:hidden">
          <Logo size="sm" />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            className="rounded-lg p-2 text-canvas-700 hover:bg-canvas-100"
          >
            <IconMenu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
