import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LayoutDashboard, Layers, TrendingUp, MapPin, Wrench, Sparkles, Settings, Info, ArrowRight, X } from "lucide-react";

const SEARCH_ITEMS = [
  { title: "Executive Dashboard", description: "Overview of production, reserves & fleet", path: "/dashboard", icon: LayoutDashboard, category: "Navigation" },
  { title: "Reserve Intelligence", description: "Geological reserves, grade & analysis", path: "/reserves", icon: Layers, category: "Navigation" },
  { title: "Production Forecast", description: "Shortfall predictions & target tracking", path: "/production", icon: TrendingUp, category: "Navigation" },
  { title: "Mining GIS Map", description: "Spatial analysis & interactive zone map", path: "/map", icon: MapPin, category: "Navigation" },
  { title: "Equipment Telemetry", description: "Fleet health, telemetry & status", path: "/equipment", icon: Wrench, category: "Navigation" },
  { title: "AI Recommendations", description: "Explainable ML insights & alerts", path: "/insights", icon: Sparkles, category: "Navigation" },
  { title: "Platform Settings", description: "API configuration & backend preferences", path: "/settings", icon: Settings, category: "Navigation" },
  { title: "About Platform", description: "System architecture & overview", path: "/about", icon: Info, category: "Navigation" },
  { title: "Dongri Buzurg Mine", description: "High-grade manganese sector", path: "/map?zone=Z-01", icon: MapPin, category: "Mine Zone" },
  { title: "Balaghat Main Pit", description: "Deep underground pit sector", path: "/map?zone=Z-02", icon: MapPin, category: "Mine Zone" },
  { title: "Chikla Pit B", description: "Medium grade ore body", path: "/map?zone=Z-03", icon: MapPin, category: "Mine Zone" },
  { title: "CAT 777G Haul Truck", description: "Heavy transport fleet unit #HT-104", path: "/equipment?id=EQ-104", icon: Wrench, category: "Equipment" },
  { title: "Sandvik DR412i Drill", description: "Primary blast hole drill #DR-201", path: "/equipment?id=EQ-201", icon: Wrench, category: "Equipment" },
];

export const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = SEARCH_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-white border border-[#D8E6F3] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="relative border-b border-[#EBF3FB] p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#3498DB] flex-shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search pages, mine zones, equipment, or metrics... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-[#1B2942] placeholder-[#606F81] outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[#606F81] hover:text-[#1B2942]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#606F81]">
              No results found matching "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSelect(item.path)}
                  className="w-full text-left p-3 rounded-xl hover:bg-[#F0F7FF] border border-transparent hover:border-[#D8E6F3] flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#F0F7FF] text-[#3498DB] group-hover:bg-[#E6F3FF] transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#1B2942] group-hover:text-[#3498DB] transition-colors flex items-center gap-2">
                        {item.title}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E6F3FF] text-[#606F81] font-mono">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#606F81]">{item.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#606F81] group-hover:text-[#3498DB] group-hover:translate-x-1 transition-all" />
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#EBF3FB] bg-[#F8FBFE] flex items-center justify-between text-[11px] text-[#606F81]">
          <span>Navigate with click or search query</span>
          <span className="font-mono bg-white border border-[#D8E6F3] px-2 py-0.5 rounded text-[#606F81]">ESC to close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
