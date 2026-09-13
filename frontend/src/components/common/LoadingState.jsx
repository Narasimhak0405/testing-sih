import React from "react";
import { Loader2, Pickaxe } from "lucide-react";

export const LoadingState = ({ message = "Running AI Geological Analysis...", subtext = "Processing spectral inversion & borehole yield data" }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#D8E6F3] rounded-xl min-h-[300px] text-center shadow-xs">
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-full border-2 border-[#3498DB]/20 border-t-[#3498DB] animate-spin flex items-center justify-center"></div>
        <Pickaxe className="w-6 h-6 text-[#3498DB] absolute inset-0 m-auto animate-pulse" />
      </div>
      <h4 className="text-base font-bold text-[#1B2942] tracking-tight">
        {message}
      </h4>
      {subtext && (
        <p className="text-xs text-[#606F81] mt-1 max-w-sm">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default LoadingState;
