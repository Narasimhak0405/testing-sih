import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CommandPalette from "./CommandPalette";

const ROUTE_NAMES = {
  "/": "Executive Dashboard",
  "/dashboard": "Executive Dashboard",
  "/reserves": "Reserve Intelligence & AI Analysis",
  "/production": "Production Forecast & Shortfall Risk",
  "/map": "Mining GIS Map & Zone Explorer",
  "/equipment": "Equipment Telemetry & Fleet Health",
  "/insights": "Explainable AI Insights & Recommendations",
  "/settings": "Platform & API Configuration",
  "/about": "Platform Overview & System Architecture",
};

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentRouteName = ROUTE_NAMES[location.pathname] || "Executive Dashboard";

  const handleAlertClick = (alert) => {
    if (alert.zoneId) {
      navigate(`/map?zone=${alert.zoneId}`);
    } else if (alert.equipmentId) {
      navigate(`/equipment?id=${alert.equipmentId}`);
    } else {
      navigate("/insights");
    }
  };

  return (
    <div className="min-h-screen bg-[#A0D2F9] dark:bg-[#090D16] blueprint-grid text-[#1B2942] dark:text-white flex flex-col font-sans antialiased selection:bg-[#3498DB] selection:text-white">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Command Palette Search Modal */}
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Main Content Area Wrapper */}
      <div className={`flex-1 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"} transition-all duration-300 flex flex-col min-w-0`}>
        {/* Persistent Top Header */}
        <Header
          currentRouteName={currentRouteName}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isCollapsed={isCollapsed}
          onAlertClick={handleAlertClick}
          onOpenSearch={() => setSearchOpen(true)}
        />

        {/* Page Main Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

