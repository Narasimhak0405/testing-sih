import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  TrendingUp,
  MapPin,
  Wrench,
  Sparkles,
  Settings,
  Info,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", name: "Dashboard", icon: LayoutDashboard },
  { path: "/reserves", name: "Reserve Intelligence", icon: Layers },
  { path: "/production", name: "Production Forecast", icon: TrendingUp },
  { path: "/map", name: "Mining Map", icon: MapPin },
  { path: "/equipment", name: "Equipment", icon: Wrench },
  { path: "/insights", name: "AI Insights", icon: Sparkles },
];

const SECONDARY_ITEMS = [
  { path: "/settings", name: "Settings", icon: Settings },
  { path: "/about", name: "About Platform", icon: Info },
];

export const Sidebar = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 bg-[#DCC7A1] dark:bg-[#101726] border-r border-[#C9B38B] dark:border-[#1E293B] z-50 flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-64`}
      >
        <div>
          {/* Sidebar Top Header with Show/Hide Toggle Button */}
          <div className="h-16 px-4 border-b border-[#C9B38B] dark:border-[#1E293B] flex items-center justify-between">
            {!isCollapsed && (
              <div className="hidden lg:flex items-center gap-2">
                <span className="font-extrabold text-sm text-[#1B2942] dark:text-white tracking-wider uppercase">
                  ManganAI
                </span>
                <span className="text-[9px] font-bold bg-[#1B2942] text-white dark:bg-[#3498DB] px-1.5 py-0.5 rounded">
                  v2.5
                </span>
              </div>
            )}

            {/* Desktop Side Panel Toggle Button */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-2 text-[#1B2942] dark:text-white hover:bg-[#C9B38B]/60 dark:hover:bg-[#152238] rounded-xl transition-colors cursor-pointer mx-auto lg:mx-0"
              title={isCollapsed ? "Expand Side Panel" : "Hide / Collapse Side Panel"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-[#3498DB]" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-[#1B2942] dark:text-slate-300" />
              )}
            </button>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden text-[#1B2942] dark:text-white hover:bg-[#C9B38B] dark:hover:bg-[#152238] p-1.5 rounded-lg transition-colors ml-auto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 pt-4">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#556475] dark:text-[#94A3B8] tracking-wider">
                Core Analytics
              </div>
            )}
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  title={isCollapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isCollapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-[#1B2942] dark:bg-[#3498DB] text-white font-semibold shadow-sm"
                        : "text-[#1B2942] dark:text-[#CBD5E1] hover:bg-[#CDB58E]/50 dark:hover:bg-[#152238] hover:text-[#0C1524] dark:hover:text-white"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>
              );
            })}

            {!isCollapsed && (
              <div className="pt-5 px-3 py-1 text-[10px] uppercase font-bold text-[#556475] dark:text-[#94A3B8] tracking-wider">
                System Settings
              </div>
            )}
            {SECONDARY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  title={isCollapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isCollapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-[#1B2942] dark:bg-[#3498DB] text-white font-semibold shadow-sm"
                        : "text-[#1B2942] dark:text-[#CBD5E1] hover:bg-[#CDB58E]/50 dark:hover:bg-[#152238] hover:text-[#0C1524] dark:hover:text-white"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info card */}
        <div className={`p-3 m-3 rounded-xl bg-white/90 dark:bg-[#152238] border border-[#C5AF89] dark:border-[#1E293B] text-xs shadow-xs space-y-1.5 ${
          isCollapsed ? "flex justify-center" : ""
        }`}>
          {isCollapsed ? (
            <span className="w-2.5 h-2.5 rounded-full bg-[#27AE60] shadow-xs" title="System Operational" />
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#1B2942] dark:text-white">System Status</span>
                <span className="flex items-center gap-1.5 text-[#27AE60] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#27AE60]"></span>
                  Operational
                </span>
              </div>
              <p className="text-[10px] text-[#606F81] dark:text-[#94A3B8] leading-tight">
                Central Belt Geological AI • Enterprise Node Active
              </p>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
