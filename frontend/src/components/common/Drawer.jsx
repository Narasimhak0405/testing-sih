import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Drawer = ({ isOpen, onClose, title, children, width = "w-full max-w-lg" }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={`${width} bg-white dark:bg-[#131B2E] border-l border-[#D8E6F3] dark:border-[#1E293B] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBF3FB] dark:border-[#1E293B] bg-[#F8FBFE] dark:bg-[#0D1527]">
            <h3 className="text-base font-bold text-[#1B2942] dark:text-white tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#606F81] dark:text-[#94A3B8] hover:text-[#1B2942] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Drawer;
