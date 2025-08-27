import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "./components/layout";
import ProtectedRoute from "./components/protected-route";
import PublicRoute from "./components/public-route";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import SettingsPage from "./pages/SettingsPage";
import MyEventsPage from "./pages/MyEventsPage";
import EventPage from "./pages/EventPage";
import NotFoundPage from "./pages/NotFoundPage";
import PublicEventsPage from "./pages/PublicEventsPage";
import MyTicketsPage from "./pages/MyTicketsPage";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="eventhub-ui-theme">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-events"
              element={
                <ProtectedRoute requiredRole="ORGANIZER">
                  <MyEventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-tickets"
              element={
                <ProtectedRoute requiredRole="CUSTOMER">
                  <MyTicketsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/events" element={<PublicEventsPage />} />
            <Route path="/events/:id" element={<EventPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
