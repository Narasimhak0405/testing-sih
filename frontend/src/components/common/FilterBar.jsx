import React from "react";
import { Filter, RotateCcw } from "lucide-react";

export const FilterBar = ({
  filters = [],
  values = {},
  onChange,
  onReset,
  className = "",
}) => {
  return (
    <div
      className={`bg-white border border-[#D8E6F3] rounded-xl p-3 shadow-xs flex flex-wrap items-center gap-3 ${className}`}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#606F81] uppercase tracking-wider pr-2 border-r border-[#EBF3FB]">
        <Filter className="w-3.5 h-3.5 text-[#3498DB]" />
        Filter:
      </div>

      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-2">
          {filter.type === "select" && (
            <select
              value={values[filter.key] || ""}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="bg-[#F8FBFE] border border-[#D8E6F3] text-[#1B2942] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#3498DB] focus:ring-1 focus:ring-[#3498DB]/30 transition-all cursor-pointer font-medium"
            >
              <option value="">{filter.placeholder || `All ${filter.label}`}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {filter.type === "text" && (
            <input
              type="text"
              value={values[filter.key] || ""}
              onChange={(e) => onChange(filter.key, e.target.value)}
              placeholder={filter.placeholder || filter.label}
              className="bg-[#F8FBFE] border border-[#D8E6F3] text-[#1B2942] text-xs rounded-lg px-3 py-1.5 placeholder-[#606F81] focus:outline-none focus:border-[#3498DB] focus:ring-1 focus:ring-[#3498DB]/30 transition-all font-medium"
            />
          )}
        </div>
      ))}

      {onReset && (
        <button
          onClick={onReset}
          className="ml-auto text-xs text-[#606F81] hover:text-[#1B2942] flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-[#D8E6F3] cursor-pointer shadow-2xs font-medium"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      )}
    </div>
  );
};

export default FilterBar;
