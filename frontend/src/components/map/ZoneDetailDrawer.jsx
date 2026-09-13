import React from "react";
import Drawer from "../common/Drawer";
import RiskBadge from "../common/RiskBadge";
import { formatGrade, formatTonnes, getPotentialBadgeStyle } from "../../utils/formatters";
import { Pickaxe, Sparkles, MapPin, Activity, ShieldCheck, ChevronRight, Trash2 } from "lucide-react";

export const ZoneDetailDrawer = ({ zone, isOpen, onClose, onViewAnalysis, onDeleteZone }) => {
  if (!zone) return null;

  const potentialBadge = getPotentialBadgeStyle(zone.reservePotential);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Mining Intelligence — ${zone.id}`}
      width="w-full max-w-md"
    >
      <div className="space-y-5">
        {/* Zone Header Banner */}
        <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#D8E6F3] space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#3498DB] bg-[#E6F3FF] px-2 py-0.5 rounded border border-[#D8E6F3]">
              {zone.id}
            </span>
            <RiskBadge risk={zone.riskLevel} />
          </div>

          <h3 className="text-lg font-bold text-[#1B2942] tracking-tight">{zone.name}</h3>

          <p className="text-xs text-[#606F81] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#3498DB]" />
            {zone.region}
          </p>

          <p className="text-xs text-[#606F81] leading-relaxed border-t border-[#EBF3FB] pt-2 mt-2">
            {zone.description}
          </p>
        </div>

        {/* Reserve Potential Highlights */}
        <div className={`p-4 rounded-xl border space-y-3 ${potentialBadge}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-[#606F81]">
              Reserve Potential
            </span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-white/80 border border-[#D8E6F3]">
              Score: {zone.potentialScore}%
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black">{zone.reservePotential}</span>
            <div className="text-right">
              <span className="text-xs text-[#606F81] block font-medium">Estimated Reserve</span>
              <span className="text-lg font-extrabold text-[#27AE60]">{zone.estimatedReserveMT} MT</span>
            </div>
          </div>
        </div>

        {/* Geological Key Parameters */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#606F81] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#3498DB]" />
            Geological & Yield Metrics
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#D8E6F3]">
              <span className="text-[10px] text-[#606F81] uppercase font-semibold block">Ore Grade</span>
              <span className="text-sm font-bold text-[#27AE60]">{formatGrade(zone.oreGradePercent)}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#D8E6F3]">
              <span className="text-[10px] text-[#606F81] uppercase font-semibold block">Geological Score</span>
              <span className="text-sm font-bold text-[#1B2942]">{zone.geologicalScore}/100</span>
            </div>
            <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#D8E6F3]">
              <span className="text-[10px] text-[#606F81] uppercase font-semibold block">Rock Density</span>
              <span className="text-sm font-bold text-[#1B2942]">{zone.rockDensity} g/cm³</span>
            </div>
            <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#D8E6F3]">
              <span className="text-[10px] text-[#606F81] uppercase font-semibold block">Depth Level</span>
              <span className="text-sm font-bold text-[#1B2942]">{zone.depthMeters} m</span>
            </div>
          </div>
        </div>

        {/* Production vs Target */}
        <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#D8E6F3] space-y-3 text-xs shadow-xs">
          <div className="flex items-center justify-between font-semibold text-[#1B2942]">
            <span>Production Output vs Target</span>
            <span className="text-[#27AE60] font-bold">{zone.shortfallPercent}% Shortfall Risk</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[#606F81]">
              <span>Current Production</span>
              <span className="font-bold text-[#1B2942]">{formatTonnes(zone.currentProductionTonnes)}</span>
            </div>
            <div className="flex justify-between text-[#606F81]">
              <span>Quarterly Target</span>
              <span className="font-bold text-[#1B2942]">{formatTonnes(zone.targetProductionTonnes)}</span>
            </div>
            <div className="w-full bg-[#EBF3FB] h-2 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full ${
                  zone.shortfallPercent > 18 ? "bg-[#E74C3C]" : "bg-[#27AE60]"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (zone.currentProductionTonnes / zone.targetProductionTonnes) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onClose();
              if (onViewAnalysis) onViewAnalysis(zone);
            }}
            className="w-full py-3 px-4 bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Run AI Deep Analysis
            <ChevronRight className="w-4 h-4" />
          </button>

          {onDeleteZone && (
            <button
              onClick={() => onDeleteZone(zone)}
              className="w-full py-2.5 px-4 bg-white hover:bg-rose-50 border border-[#E74C3C]/30 text-[#E74C3C] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-4 h-4" />
              Remove This Mining Zone
            </button>
          )}
        </div>
      </div>
    </Drawer>
  );
};

export default ZoneDetailDrawer;
