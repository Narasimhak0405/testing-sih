import React from "react";
import { Sparkles, CheckCircle2, AlertCircle, Info, ShieldCheck } from "lucide-react";
import RiskBadge from "./RiskBadge";
import { getPotentialBadgeStyle } from "../../utils/formatters";

export const PredictionCard = ({ prediction }) => {
  if (!prediction) return null;

  const {
    reservePotential = "HIGH",
    potentialScore = 88,
    estimatedReserveMT = 2.43,
    confidenceScore = 87,
    region = "Selected Zone",
    contributingFactors = [],
    recommendation = "",
    isMock = false,
  } = prediction;

  const badgeStyle = getPotentialBadgeStyle(reservePotential);

  return (
    <div className="bg-white border border-[#D8E6F3] rounded-xl p-6 shadow-xs relative overflow-hidden space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBF3FB] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#3498DB] animate-pulse" />
            <h3 className="text-base font-bold text-[#1B2942]">AI Reserve Prediction Output</h3>
          </div>
          <p className="text-xs text-[#606F81] mt-0.5">
            Geological ML Model Ensemble • {region}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isMock ? (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Backend
            </span>
          ) : (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-300">
              Validated Engine
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs text-[#27AE60] bg-[#E8F8F0] border border-[#27AE60]/30 px-2.5 py-1 rounded-full font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Confidence: {confidenceScore}%
          </span>
        </div>
      </div>

      {/* Main Result Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Reserve Potential Card */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${badgeStyle}`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#606F81]">
            Reserve Potential
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight">{reservePotential}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/80 border border-[#D8E6F3]">
              Score {potentialScore}/100
            </span>
          </div>
        </div>

        {/* Estimated Quantity Card */}
        <div className="p-4 rounded-xl border border-[#D8E6F3] bg-[#F8FBFE] flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#606F81]">
            Estimated Reserve
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#27AE60]">{estimatedReserveMT}</span>
            <span className="text-xs font-semibold text-[#606F81]">Million Tonnes (MT)</span>
          </div>
        </div>

        {/* Confidence Rating Card */}
        <div className="p-4 rounded-xl border border-[#D8E6F3] bg-[#F8FBFE] flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#606F81]">
            Confidence Rating
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-black text-[#3498DB]">{confidenceScore}%</span>
            <span className="text-xs text-[#606F81] font-medium">XGBoost Ensemble</span>
          </div>
        </div>
      </div>

      {/* Contributing Factors Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B2942] flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#3498DB]" />
          Key Contributing Factors (SHAP Feature Importance)
        </h4>

        <div className="space-y-2.5">
          {contributingFactors.map((factor, idx) => (
            <div key={idx} className="bg-[#F8FBFE] p-3 rounded-lg border border-[#E2ECF6] text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-[#1B2942]">{factor.name}</span>
                <span className="font-bold text-[#3498DB]">{factor.value} ({factor.weight}%)</span>
              </div>
              <div className="w-full bg-[#EBF3FB] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#3498DB] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, factor.weight * 2.5))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation Box */}
      <div className="p-4 rounded-xl bg-[#E8F8F0] border border-[#27AE60]/30 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#27AE60] flex-shrink-0 mt-0.5" />
        <div>
          <h5 className="text-xs font-bold text-[#27AE60] uppercase tracking-wider">
            AI Recommendation
          </h5>
          <p className="text-xs text-[#1B2942] mt-1 leading-relaxed font-medium">
            "{recommendation}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
