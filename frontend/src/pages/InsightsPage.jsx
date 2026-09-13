import React, { useState, useEffect } from "react";
import { Sparkles, Brain, CheckCircle2, ShieldCheck, ArrowRight, Pickaxe, Info, AlertTriangle, Layers } from "lucide-react";
import LoadingState from "../components/common/LoadingState";
import RiskBadge from "../components/common/RiskBadge";
import { getAIInsights } from "../services/api";

export const InsightsPage = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const data = await getAIInsights();
        setInsights(data);
        if (data.length > 0) setSelectedInsight(data[0]);
      } catch (err) {
        console.error("AI Insights fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return <LoadingState message="Extracting Explainable AI (XAI) Feature Importance Matrix..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-white border border-[#D8E6F3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B2942] tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#3498DB]" />
            Explainable AI (XAI) Mining Decision Support
          </h2>
          <p className="text-xs text-[#606F81] mt-1">
            Translating complex XGBoost & Geospatial Transformer weights into human-interpretable geological and operational decision paths.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#27AE60] bg-[#E8F8F0] px-3 py-1.5 rounded-lg border border-[#27AE60]/30 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-[#27AE60]" />
            XAI Interpreter Online
          </span>
        </div>
      </div>

      {/* Grid Layout: Insight Selector Cards (Left 5 cols) vs Detailed XAI Inspection (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Insight List Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#606F81]">
            Active Geological & Operational Insights
          </h3>

          {insights.map((item) => {
            const isSelected = selectedInsight?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedInsight(item)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? "bg-[#F0F7FF] border-[#3498DB] shadow-sm"
                    : "bg-white border-[#D8E6F3] hover:border-[#B5D2ED] shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#3498DB]">{item.zoneId}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#EBF3FB] text-[#1B2942] border border-[#D8E6F3]">
                    {item.type}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#1B2942] tracking-tight">{item.title}</h4>

                <p className="text-xs text-[#606F81] line-clamp-2">{item.summary}</p>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#EBF3FB]">
                  <span className="text-[#27AE60] font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Confidence {item.confidence}%
                  </span>
                  <span className="text-[#3498DB] font-bold flex items-center gap-1 hover:underline">
                    Inspect XAI →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed XAI Inspection View (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedInsight && (
            <div className="bg-white border border-[#D8E6F3] rounded-xl p-6 shadow-xs space-y-6">
              {/* Header */}
              <div className="border-b border-[#EBF3FB] pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#3498DB] bg-[#E6F3FF] px-2.5 py-1 rounded border border-[#D8E6F3]">
                    {selectedInsight.zoneId} — {selectedInsight.zoneName}
                  </span>
                  <span className="text-xs font-bold text-[#27AE60] bg-[#E8F8F0] border border-[#27AE60]/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Model Confidence: {selectedInsight.confidence}%
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-[#1B2942]">{selectedInsight.title}</h3>
                <p className="text-xs text-[#606F81] leading-relaxed bg-[#F8FBFE] p-3 rounded-lg border border-[#D8E6F3]">
                  {selectedInsight.summary}
                </p>
              </div>

              {/* SHAP Feature Contribution Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B2942] flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#3498DB]" />
                  Feature Importance & Weight Attribution
                </h4>

                <div className="space-y-3">
                  {selectedInsight.contributingFactors.map((factor, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#F8FBFE] border border-[#D8E6F3] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-[#1B2942] font-bold">{factor.factor}</span>
                        <span className="text-[#3498DB] font-extrabold">{factor.weight}% Weight</span>
                      </div>
                      <div className="w-full bg-[#EBF3FB] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#3498DB] to-[#27AE60] h-full rounded-full transition-all duration-500"
                          style={{ width: `${factor.weight * 2.2}%` }}
                        />
                      </div>
                      <p className="text-[#606F81] text-[11px]">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Executive Recommendation Box */}
              <div className="p-4 rounded-xl bg-[#E8F8F0] border border-[#27AE60]/30 space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#27AE60] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#27AE60]" />
                  Actionable Executive Recommendation
                </h4>
                <p className="text-xs text-[#1B2942] font-medium leading-relaxed">
                  "{selectedInsight.recommendation}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
