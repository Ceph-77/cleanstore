import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { track } from "./analytics";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./routes/LoginPage";
import { homeForRole } from "./lib/homeForRole";
import type { RoleKey } from "./types";

// Everything except the login screen (the cold-start entry for logged-out users)
// is split into its own chunk. A worker on mobile no longer downloads the admin
// pages or the Leaflet map / Stripe bundles just to see their task list.
const named =
  (name: string) =>
  (m: Record<string, unknown>) => ({ default: m[name] as React.ComponentType });

const RegisterWorkerPage = lazy(() => import("./routes/RegisterWorkerPage").then(named("RegisterWorkerPage")));
const ForgotPasswordPage = lazy(() => import("./routes/ForgotPasswordPage").then(named("ForgotPasswordPage")));
const ResetPasswordPage = lazy(() => import("./routes/ResetPasswordPage").then(named("ResetPasswordPage")));
const TermsPage = lazy(() => import("./routes/TermsPage").then(named("TermsPage")));
const PrivacyPage = lazy(() => import("./routes/PrivacyPage").then(named("PrivacyPage")));
const AcceptTermsPage = lazy(() => import("./routes/AcceptTermsPage").then(named("AcceptTermsPage")));
const StoresListPage = lazy(() => import("./routes/StoresListPage").then(named("StoresListPage")));
const StoreFormPage = lazy(() => import("./routes/StoreFormPage").then(named("StoreFormPage")));
const StoreDetailPage = lazy(() => import("./routes/StoreDetailPage").then(named("StoreDetailPage")));
const StoreEditPage = lazy(() => import("./routes/StoreEditPage").then(named("StoreEditPage")));
const StoreMapPage = lazy(() => import("./routes/StoreMapPage").then(named("StoreMapPage")));
const StoreMarketplacePage = lazy(() => import("./routes/marketplace/StoreMarketplacePage").then(named("StoreMarketplacePage")));
const TaskMarketplacePage = lazy(() => import("./routes/marketplace/TaskMarketplacePage").then(named("TaskMarketplacePage")));
const MyTasksPage = lazy(() => import("./routes/marketplace/MyTasksPage").then(named("MyTasksPage")));
const SubcontractorTasksPage = lazy(() => import("./routes/marketplace/SubcontractorTasksPage").then(named("SubcontractorTasksPage")));
const PaymentSettingsPage = lazy(() => import("./routes/marketplace/PaymentSettingsPage").then(named("PaymentSettingsPage")));
const ClaimsPage = lazy(() => import("./routes/admin/ClaimsPage").then(named("ClaimsPage")));
const UsersPage = lazy(() => import("./routes/admin/UsersPage").then(named("UsersPage")));
const WorkerDetailPage = lazy(() => import("./routes/admin/WorkerDetailPage").then(named("WorkerDetailPage")));
const TasksDashboardPage = lazy(() => import("./routes/admin/TasksDashboardPage").then(named("TasksDashboardPage")));
const SettingsPage = lazy(() => import("./routes/admin/SettingsPage").then(named("SettingsPage")));
const FeedbackPage = lazy(() => import("./routes/admin/FeedbackPage").then(named("FeedbackPage")));
const ProfilePage = lazy(() => import("./routes/ProfilePage").then(named("ProfilePage")));
const LeaderboardPage = lazy(() => import("./routes/LeaderboardPage").then(named("LeaderboardPage")));
const WalletPage = lazy(() => import("./routes/WalletPage").then(named("WalletPage")));
const AnalyticsPage = lazy(() => import("./routes/admin/AnalyticsPage").then(named("AnalyticsPage")));
const TaskTemplatesPage = lazy(() => import("./routes/admin/TaskTemplatesPage").then(named("TaskTemplatesPage")));

function RouteTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    track("page_view");
  }, [pathname]);
  return null;
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Chargement...</div>
  );
}

function ProtectedRoute({
  children,
  roles,
  skipTermsCheck,
}: {
  children: React.ReactNode;
  roles?: RoleKey[];
  skipTermsCheck?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!skipTermsCheck && !user.termsAcceptedAt) {
    return <Navigate to="/accept-terms" replace />;
  }

  if (roles) {
    // accès = union des rôles de l'utilisateur (retombe sur roleKey si besoin)
    const userRoles = user.roleKeys?.length
      ? user.roleKeys
      : user.roleKey
        ? [user.roleKey]
        : [];
    if (!roles.some((r) => userRoles.includes(r))) {
      return <Navigate to={homeForRole(user.roleKey)} replace />;
    }
  }

  return <>{children}</>;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homeForRole(user?.roleKey)} replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterWorkerPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/confidentialite" element={<PrivacyPage />} />
        <Route
          path="/accept-terms"
          element={
            <ProtectedRoute skipTermsCheck>
              <AcceptTermsPage />
            </ProtectedRoute>
          }
        />

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
          path="/admin/users/:id"
          element={
            <ProtectedRoute roles={["admin"]}>
              <WorkerDetailPage />
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
          path="/admin/settings"
          element={
            <ProtectedRoute roles={["admin"]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <ProtectedRoute roles={["admin"]}>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/task-templates"
          element={
            <ProtectedRoute roles={["admin"]}>
              <TaskTemplatesPage />
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
          path="/markettask/store-tasks"
          element={
            <ProtectedRoute roles={["sous_traitant"]}>
              <SubcontractorTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/markettask/payment-settings"
          element={
            <ProtectedRoute roles={["sous_traitant"]}>
              <PaymentSettingsPage />
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
          path="/leaderboard"
          element={
            <ProtectedRoute roles={["admin", "sous_traitant"]}>
              <LeaderboardPage />
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
          path="/wallet"
          element={
            <ProtectedRoute roles={["travailleur"]}>
              <WalletPage />
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
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RouteTracker />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
