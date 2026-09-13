import React from "react";
import { Info, Pickaxe, Layers, Cpu, ShieldCheck, Database, CheckCircle2 } from "lucide-react";

export const AboutPage = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="p-6 rounded-xl bg-white border border-[#D8E6F3] shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E6F3FF] border border-[#D8E6F3] text-[#3498DB] flex items-center justify-center font-bold shadow-xs">
            <Pickaxe className="w-5 h-5 text-[#3498DB]" />
          </div>
          <div>
            <span className="text-xs font-mono font-semibold text-[#3498DB] bg-[#E6F3FF] px-2 py-0.5 rounded border border-[#D8E6F3]">
              Enterprise AI Solution • v2.4
            </span>
            <h2 className="text-lg font-bold text-[#1B2942] tracking-tight mt-1">
              Terramind — Ore Reserve & Fleet Intelligence Platform
            </h2>
          </div>
        </div>
        <p className="text-xs text-[#606F81] leading-relaxed pt-2 border-t border-[#EBF3FB]">
          An operational decision-support platform engineered for mining executives, geological engineers, and operational planning teams. The platform combines geological borehole assays, rock physics, heavy equipment telemetry, and satellite GIS spectral inversion to predict ore reserve potential, calculate estimated tonnage, and prevent production shortfalls.
        </p>
      </div>

      {/* Product Objective & Deliverables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-5 rounded-xl bg-white border border-[#D8E6F3] shadow-xs space-y-3">
          <h3 className="font-bold text-[#1B2942] text-xs flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#3498DB]" /> Core Intelligence Modules
          </h3>
          <ul className="space-y-2 text-[#606F81]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#27AE60] flex-shrink-0 mt-0.5" />
              <span><strong className="text-[#1B2942]">Ore Reserve Potential</strong> — High, Medium, Low geological probability ratings.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#27AE60] flex-shrink-0 mt-0.5" />
              <span><strong className="text-[#1B2942]">Tonnage Estimation</strong> — Reserve volume (MT) derived from density & depth modeling.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#27AE60] flex-shrink-0 mt-0.5" />
              <span><strong className="text-[#1B2942]">Production Deficit Forecasting</strong> — Time-series forecast curves with target thresholds.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#27AE60] flex-shrink-0 mt-0.5" />
              <span><strong className="text-[#1B2942]">Equipment Telemetry Health</strong> — Failure risk & vibration metrics for drill rigs and trucks.</span>
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#D8E6F3] shadow-xs space-y-3">
          <h3 className="font-bold text-[#1B2942] text-xs flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#3498DB]" /> Machine Learning Stack
          </h3>
          <ul className="space-y-2 text-[#606F81]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3498DB] flex-shrink-0 mt-0.5" />
              <span><strong className="text-[#1B2942]">XGBoost Geological Ensemble</strong> — Evaluates ore grade %, density, and borehole depth.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3498DB] flex-shrink-0 mt-0.5" />
              <span><strong className="text-[#1B2942]">Spectral Inversion Models</strong> — Multispectral satellite data for ore deposit mapping.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3498DB] flex-shrink-0 mt-0.5" />
              <span><strong className="text-[#1B2942]">Time-Series Forecasting</strong> — Models output seasonality and predicts shortfall bottlenecks.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3498DB] flex-shrink-0 mt-0.5" />
              <span><strong className="text-[#1B2942]">Explainable AI (SHAP Weights)</strong> — Clear feature importance attribution for decisions.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Technical Pipeline Flow Diagram */}
      <div className="bg-white border border-[#D8E6F3] rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-[#1B2942] uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-[#3498DB]" />
          End-to-End System Data Flow
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
          <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#D8E6F3] space-y-2">
            <span className="font-mono font-bold text-[#3498DB] text-[10px] uppercase block">Stage 1</span>
            <h4 className="font-bold text-[#1B2942]">Geological & Sensor Inputs</h4>
            <p className="text-[#606F81] text-[11px]">Borehole Assays, Ore Grade %, Rock Density, Satellite Spectral Bands, Telemetry Sensors</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#D8E6F3] space-y-2">
            <span className="font-mono font-bold text-[#27AE60] text-[10px] uppercase block">Stage 2</span>
            <h4 className="font-bold text-[#1B2942]">ML Inference Service</h4>
            <p className="text-[#606F81] text-[11px]">Model Inference, Shortfall Risk Calculation, SHAP Feature Importance Weights</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#D8E6F3] space-y-2">
            <span className="font-mono font-bold text-[#F39C12] text-[10px] uppercase block">Stage 3</span>
            <h4 className="font-bold text-[#1B2942]">Executive Control Interface</h4>
            <p className="text-[#606F81] text-[11px]">Interactive Maps, Production Forecast Curves, Telemetry & XAI Recommendations</p>
          </div>
        </div>
      </div>

      {/* Data Integrity Notice Card */}
      <div className="p-4 rounded-xl bg-white border border-[#D8E6F3] shadow-xs text-xs text-[#606F81] space-y-1">
        <h4 className="font-semibold flex items-center gap-1.5 uppercase text-[10px] text-[#27AE60]">
          <ShieldCheck className="w-4 h-4 text-[#27AE60]" />
          System Integration & Enterprise Readiness
        </h4>
        <p className="text-[#606F81] leading-relaxed text-[11px]">
          The frontend interface connects smoothly to enterprise GIS databases and REST/FastAPI backend microservices. Real-time telemetry signals can be plugged into IoT message brokers for continuous operational streaming.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
