import React from "react";
import { Download } from "lucide-react";

export const ChartCard = ({
  title,
  subtitle,
  actions,
  children,
  onExport,
  className = "",
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#131B2E] border border-[#D8E6F3] dark:border-[#1E293B] rounded-xl p-6 flex flex-col justify-between shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#EBF3FB] dark:border-[#1E293B]">
        <div>
          <h4 className="text-sm font-bold text-[#1B2942] dark:text-white tracking-tight flex items-center gap-2">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-[#606F81] dark:text-[#94A3B8] mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onExport && (
            <button
              onClick={onExport}
              className="p-1.5 rounded-lg bg-white dark:bg-[#152238] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-[#606F81] dark:text-[#CBD5E1] hover:text-[#1B2942] dark:hover:text-white border border-[#D8E6F3] dark:border-[#1E293B] text-xs flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
              title="Export Chart Data"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="w-full flex-1 min-h-[260px]">{children}</div>
    </div>
  );
};

export default ChartCard;
