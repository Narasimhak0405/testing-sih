import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Layout from "./components/common/Layout";
import DashboardPage from "./pages/DashboardPage";
import ReservesPage from "./pages/ReservesPage";
import ProductionPage from "./pages/ProductionPage";
import MapPage from "./pages/MapPage";
import EquipmentPage from "./pages/EquipmentPage";
import InsightsPage from "./pages/InsightsPage";
import SettingsPage from "./pages/SettingsPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/common/ProtectedRoute";

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="reserves" element={<ReservesPage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="equipment" element={<EquipmentPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
