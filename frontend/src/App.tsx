import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./routes/LoginPage";
import { RegisterWorkerPage } from "./routes/RegisterWorkerPage";
import { ForgotPasswordPage } from "./routes/ForgotPasswordPage";
import { ResetPasswordPage } from "./routes/ResetPasswordPage";
import { StoresListPage } from "./routes/StoresListPage";
import { StoreFormPage } from "./routes/StoreFormPage";
import { StoreDetailPage } from "./routes/StoreDetailPage";
import { StoreEditPage } from "./routes/StoreEditPage";
import { StoreMapPage } from "./routes/StoreMapPage";
import { StoreMarketplacePage } from "./routes/marketplace/StoreMarketplacePage";
import { TaskMarketplacePage } from "./routes/marketplace/TaskMarketplacePage";
import { MyTasksPage } from "./routes/marketplace/MyTasksPage";
import { ClaimsPage } from "./routes/admin/ClaimsPage";
import { UsersPage } from "./routes/admin/UsersPage";
import { TasksDashboardPage } from "./routes/admin/TasksDashboardPage";
import { ProfilePage } from "./routes/ProfilePage";
import type { RoleKey } from "./types";

const queryClient = new QueryClient();

function homeForRole(role: RoleKey | null | undefined) {
  if (role === "sous_traitant") return "/markettask/stores";
  if (role === "travailleur") return "/markettask/tasks";
  return "/stores";
}

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: RoleKey[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.roleKey as RoleKey)) {
    return <Navigate to={homeForRole(user.roleKey)} replace />;
  }

  return <>{children}</>;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homeForRole(user?.roleKey)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterWorkerPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/stores"
        element={
          <ProtectedRoute roles={["admin"]}>
            <StoresListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stores/new"
        element={
          <ProtectedRoute roles={["admin"]}>
            <StoreFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stores/map"
        element={
          <ProtectedRoute roles={["admin"]}>
            <StoreMapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stores/:id"
        element={
          <ProtectedRoute roles={["admin"]}>
            <StoreDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stores/:id/edit"
        element={
          <ProtectedRoute roles={["admin"]}>
            <StoreEditPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/claims"
        element={
          <ProtectedRoute roles={["admin"]}>
            <ClaimsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks"
        element={
          <ProtectedRoute roles={["admin"]}>
            <TasksDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/markettask/stores"
        element={
          <ProtectedRoute roles={["sous_traitant"]}>
            <StoreMarketplacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/markettask/tasks"
        element={
          <ProtectedRoute roles={["travailleur"]}>
            <TaskMarketplacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/markettask/my-tasks"
        element={
          <ProtectedRoute roles={["travailleur"]}>
            <MyTasksPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <ProtectedRoute>
            <HomeRedirect />
          </ProtectedRoute>
        }
      />
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
