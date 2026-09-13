import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export const ErrorState = ({
  title = "Telemetry Error",
  message = "Failed to load telemetry or prediction model response.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-white border border-[#FDEDEC] rounded-xl min-h-[250px] text-center shadow-xs">
      <div className="p-3 bg-[#FDEDEC] rounded-full text-[#E74C3C] border border-[#E74C3C]/30 mb-3">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-[#1B2942]">{title}</h4>
      <p className="text-xs text-[#606F81] mt-1 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-white hover:bg-slate-50 text-[#1B2942] rounded-lg border border-[#D8E6F3] shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#3498DB]" />
          Retry Connection
        </button>
      )}
    </div>
  );
};

export default ErrorState;
