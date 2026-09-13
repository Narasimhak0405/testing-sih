import React, { useState, useEffect } from "react";
import { Bell, Search, Clock, Cpu, ChevronDown, Menu, ShieldAlert, CheckCircle, Sun, Moon, PanelLeft } from "lucide-react";
import { getApiSettings } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { MOCK_ALERTS } from "../../data/mockData";
import Modal from "./Modal";

export const Header = ({ currentRouteName, onToggleSidebar, onToggleCollapse, isCollapsed, onAlertClick, onOpenSearch }) => {
  const [timeStr, setTimeStr] = useState("");
  const [showAlertModal, setShowAlertModal] = useState(false);
  const settings = getApiSettings();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="h-16 bg-[#A0D2F9]/90 dark:bg-[#101726]/90 backdrop-blur-md border-b border-[#3498DB]/25 dark:border-[#1E293B] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Menu & Side Panel Show/Hide Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.innerWidth >= 1024) {
                if (onToggleCollapse) onToggleCollapse();
              } else {
                if (onToggleSidebar) onToggleSidebar();
              }
            }}
            className="p-2 rounded-xl text-[#1B2942] dark:text-[#CBD5E1] hover:bg-white/80 dark:hover:bg-[#152238] transition-colors border border-[#D8E6F3] dark:border-[#1E293B] cursor-pointer shadow-xs"
            title="Toggle Side Panel (Show / Hide)"
          >
            <PanelLeft className="w-5 h-5 text-[#3498DB]" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#1B2942] dark:text-white tracking-tight flex items-center gap-2">
              {currentRouteName || "Executive Dashboard"}
            </h1>
            <p className="text-xs text-[#606F81] dark:text-[#94A3B8] font-normal hidden sm:block">
              Geological & Production Decision Support System
            </p>
          </div>
        </div>

        {/* System Status Indicators & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Command Palette Button */}
          <button
            onClick={onOpenSearch}
            className="hidden md:flex items-center gap-2 bg-white dark:bg-[#152238] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-[#606F81] dark:text-[#CBD5E1] hover:text-[#1B2942] dark:hover:text-white border border-[#D8E6F3] dark:border-[#1E293B] px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-[#3498DB]" />
            <span>Search...</span>
            <kbd className="hidden lg:inline-block text-[10px] bg-[#89C7F7] dark:bg-[#0D1527] px-1.5 py-0.5 rounded border border-[#3498DB]/30 dark:border-[#1E293B] font-mono text-[#1B2942] dark:text-[#94A3B8]">
              Ctrl+K
            </kbd>
          </button>

          {/* Live System Clock */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#606F81] dark:text-[#94A3B8] bg-white dark:bg-[#152238] px-3 py-1.5 rounded-lg border border-[#D8E6F3] dark:border-[#1E293B] shadow-xs">
            <Clock className="w-3.5 h-3.5 text-[#606F81] dark:text-[#94A3B8]" />
            <span className="font-mono font-semibold text-[#1B2942] dark:text-white">{timeStr}</span>
          </div>

          {/* Model Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs bg-white dark:bg-[#152238] px-3 py-1.5 rounded-lg border border-[#D8E6F3] dark:border-[#1E293B] shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#27AE60]"></span>
            </span>
            <span className="text-[#1B2942] dark:text-white font-semibold text-[11px]">
              {settings.useLiveBackend ? "Backend Live" : "AI Engine Active"}
            </span>
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-[#152238] text-[#606F81] dark:text-[#F1C40F] hover:text-[#1B2942] dark:hover:text-white border border-[#D8E6F3] dark:border-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors shadow-xs cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-[#F1C40F]" />
            ) : (
              <Moon className="w-4 h-4 text-[#3498DB]" />
            )}
          </button>

          {/* Notifications Bell Button */}
          <button
            onClick={() => setShowAlertModal(true)}
            className="relative p-2 rounded-lg bg-white dark:bg-[#152238] text-[#606F81] dark:text-[#CBD5E1] hover:text-[#1B2942] dark:hover:text-white border border-[#D8E6F3] dark:border-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors shadow-xs cursor-pointer"
            title="System Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E74C3C] text-[10px] font-bold text-white flex items-center justify-center border border-white">
              {MOCK_ALERTS.length}
            </span>
          </button>

          {/* User Sign Out / Account */}
          {user && (
            <button
              onClick={signOut}
              className="text-xs font-medium text-[#1B2942] dark:text-white hover:text-black dark:hover:text-slate-100 bg-white dark:bg-[#152238] hover:bg-slate-50 dark:hover:bg-[#1E293B] border border-[#D8E6F3] dark:border-[#1E293B] px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
              title={`Signed in as ${user?.email || ""}`}
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      {/* Notifications Modal */}
      <Modal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title="Operational & AI System Alerts"
      >
        <div className="space-y-2.5">
          {MOCK_ALERTS.map((alert) => (
            <div
              key={alert.id}
              onClick={() => {
                setShowAlertModal(false);
                if (onAlertClick) onAlertClick(alert);
              }}
              className="p-3.5 rounded-xl bg-white border border-[#D8E6F3] hover:border-[#3498DB]/50 transition-all cursor-pointer space-y-1 group shadow-xs"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-[#3498DB] uppercase text-[10px] tracking-wider">
                  {alert.category}
                </span>
                <span className="text-[10px] text-[#606F81] font-medium">
                  {alert.timestamp}
                </span>
              </div>
              <h4 className="text-xs font-bold text-[#1B2942] group-hover:text-[#3498DB] transition-colors">
                {alert.title}
              </h4>
              <p className="text-[11px] text-[#606F81] leading-relaxed">
                {alert.message}
              </p>
              {alert.actionText && (
                <div className="pt-1 text-[11px] font-medium text-[#3498DB] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {alert.actionText} →
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default Header;
