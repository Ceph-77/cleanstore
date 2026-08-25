import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthUser } from "../types";
import * as authApi from "../api/auth";
import { ApiError } from "../api/client";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isImpersonating: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerWorker: (data: authApi.RegisterWorkerInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: authApi.UpdateProfileInput) => Promise<void>;
  acceptTerms: () => Promise<void>;
  impersonate: (userId: string) => Promise<void>;
  stopImpersonating: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then(({ user, impersonating }) => {
        setUser(user);
        setIsImpersonating(impersonating);
      })
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error(err);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { user } = await authApi.login(email, password);
    setUser(user);
  }

  async function registerWorker(data: authApi.RegisterWorkerInput) {
    const { user } = await authApi.registerWorker(data);
    setUser(user);
  }

  async function logout() {
    await authApi.logout();
    setUser(null);
    setIsImpersonating(false);
  }

  async function updateProfile(data: authApi.UpdateProfileInput) {
    const { user } = await authApi.updateProfile(data);
    setUser(user);
  }

  async function acceptTerms() {
    const { user } = await authApi.acceptTerms();
    setUser(user);
  }

  async function impersonate(userId: string) {
    const { user } = await authApi.impersonate(userId);
    setUser(user);
    setIsImpersonating(true);
  }

  async function stopImpersonating() {
    const { user } = await authApi.stopImpersonating();
    setUser(user);
    setIsImpersonating(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isImpersonating,
        login,
        registerWorker,
        logout,
        updateProfile,
        acceptTerms,
        impersonate,
        stopImpersonating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
