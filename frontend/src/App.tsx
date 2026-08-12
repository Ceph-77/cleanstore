import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./routes/LoginPage";
import { StoresListPage } from "./routes/StoresListPage";
import { StoreFormPage } from "./routes/StoreFormPage";
import { StoreDetailPage } from "./routes/StoreDetailPage";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/stores"
        element={
          <ProtectedRoute>
            <StoresListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stores/new"
        element={
          <ProtectedRoute>
            <StoreFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stores/:id"
        element={
          <ProtectedRoute>
            <StoreDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/stores" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
