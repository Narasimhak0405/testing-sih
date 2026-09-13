import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#A0D2F9] dark:bg-[#090D16] text-[#1B2942] dark:text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-[#D8E6F3] shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#FDEDEC] border border-[#E74C3C]/30 text-[#E74C3C] mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-[#1B2942] tracking-tight">
              Mission Control Error Caught
            </h2>

            <p className="text-xs text-[#606F81] leading-relaxed">
              An unhandled UI component error occurred:
            </p>

            <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#D8E6F3] text-[11px] font-mono text-[#E74C3C] text-left overflow-x-auto max-h-32">
              {this.state.error ? String(this.state.error.message || this.state.error) : "Unknown Error"}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reload Platform
              </button>

              <a
                href="/"
                className="px-4 py-2 bg-white hover:bg-slate-50 text-[#1B2942] font-bold text-xs rounded-xl border border-[#D8E6F3] flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Home className="w-3.5 h-3.5 text-[#3498DB]" /> Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
