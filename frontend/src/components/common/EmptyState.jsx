import React from "react";
import { Layers } from "lucide-react";

export const EmptyState = ({
  title = "No Data Available",
  message = "Select a mining zone or adjust your filters to view intelligence metrics.",
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-white border border-dashed border-[#D8E6F3] rounded-xl min-h-[240px] text-center shadow-xs">
      <div className="p-3 bg-[#E6F3FF] rounded-full text-[#3498DB] mb-3 border border-[#D8E6F3]">
        <Layers className="w-7 h-7" />
      </div>
      <h4 className="text-sm font-bold text-[#1B2942]">{title}</h4>
      <p className="text-xs text-[#606F81] mt-1 max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
