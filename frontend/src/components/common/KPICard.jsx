import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import StatusBadge from "./StatusBadge";

export const KPICard = ({
  title,
  value,
  subtext,
  change,
  isPositive,
  icon: Icon,
  status,
  progress,
  progressColor = "#E74C3C",
  className = "",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#131B2E] border border-[#D8E6F3] dark:border-[#1E293B] rounded-xl p-6 transition-all hover:border-[#3498DB]/40 shadow-xs ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#606F81] dark:text-[#94A3B8]">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {status && <StatusBadge status={status} />}
          {Icon && (
            <div className="p-2 rounded-lg bg-[#F0F7FF] dark:bg-[#152238] text-[#606F81] dark:text-[#CBD5E1] border border-[#D8E6F3] dark:border-[#1E293B]">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <h3 className="text-3xl font-bold text-[#1B2942] dark:text-white tracking-tight">
          {value}
        </h3>
        {change && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              isPositive ? "text-[#27AE60]" : "text-[#E74C3C]"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {change}
          </span>
        )}
      </div>

      {progress != null && (
        <div className="w-full bg-slate-100 dark:bg-[#152238] h-2 rounded-full overflow-hidden mt-3 border border-[#D8E6F3] dark:border-[#1E293B]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
      )}

      {subtext && (
        <p className="text-xs text-[#606F81] dark:text-[#94A3B8] mt-3 font-normal">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default KPICard;
