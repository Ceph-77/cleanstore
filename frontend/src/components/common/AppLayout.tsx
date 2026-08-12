import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "./Logo";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-canvas-0">
      <header className="border-b border-canvas-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/stores">
            <Logo />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2 rounded-full bg-canvas-100 px-3 py-1 text-canvas-700">
              <span className="h-1.5 w-1.5 rounded-full bg-linen-400" />
              {user?.fullName ?? user?.email}
            </span>
            <button onClick={handleLogout} className="font-medium text-flow-700 hover:text-flow-900">
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
