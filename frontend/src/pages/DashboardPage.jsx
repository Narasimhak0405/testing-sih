import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  TrendingUp,
  Package,
  Zap,
  Sparkles,
  Pickaxe,
} from "lucide-react";
import KPICard from "../components/common/KPICard";
import ChartCard from "../components/common/ChartCard";
import RiskBadge from "../components/common/RiskBadge";
import LoadingState from "../components/common/LoadingState";
import { getDashboardData } from "../services/api";
import { formatGrade } from "../utils/formatters";
import { exportToCSV } from "../utils/exportUtils";
import { useTheme } from "../context/ThemeContext";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await getDashboardData();
        setData(res);
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <LoadingState
        message="Connecting to Mining Mission Control..."
        subtext="Syncing telemetry from MOIL Balaghat & Bhandara sectors"
      />
    );
  }

  const { kpis, productionTrends, reserveMatrix, zones, alerts } = data;

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percentage,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#FFFFFF"
        stroke="#0B132B"
        strokeWidth="2.5px"
        paintOrder="stroke fill"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: "12px",
          fontWeight: "900",
        }}
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#131B2E] border border-[#D8E6F3] dark:border-[#1E293B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#F0F7FF] dark:bg-[#152238] text-[#1B2942] dark:text-white border border-[#D8E6F3] dark:border-[#1E293B]">
            <Pickaxe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1B2942] dark:text-white tracking-tight flex items-center gap-2.5">
              Geological Ore & Fleet Intelligence Dashboard
              {data?.isMock === false ? (
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-400 dark:border-emerald-600 flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live ML & Database Active
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-300">
                  Simulation Mode
                </span>
              )}
            </h2>
            <p className="text-xs text-[#606F81] dark:text-[#94A3B8] mt-1">
              Real-time reserve estimation, production shortfall risk analysis, and fleet telemetry.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(zones, "zone_intelligence_report.csv")}
            className="px-4 py-2 bg-white dark:bg-[#152238] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-[#606F81] dark:text-[#CBD5E1] hover:text-[#1B2942] dark:hover:text-white border border-[#D8E6F3] dark:border-[#1E293B] text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Export Report (CSV)
          </button>
          <button
            onClick={() => navigate("/reserves")}
            className="px-5 py-2.5 bg-[#3498DB] hover:bg-[#2980B9] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Run AI Reserve Analysis
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Potential Reserves"
          value={kpis.potentialReserves.value}
          subtext={kpis.potentialReserves.subtext}
          change={kpis.potentialReserves.change}
          isPositive={kpis.potentialReserves.isPositive}
          icon={Layers}
          status={kpis.potentialReserves.status}
          onClick={() => navigate("/reserves")}
        />
        <KPICard
          title="Predicted Production"
          value={kpis.predictedProduction.value}
          subtext={kpis.predictedProduction.subtext}
          change={kpis.predictedProduction.change}
          isPositive={kpis.predictedProduction.isPositive}
          icon={TrendingUp}
          status={kpis.predictedProduction.status}
          onClick={() => navigate("/production")}
        />
        <KPICard
          title="Active Ore Stockpile"
          value={kpis.oreStockpile?.value || "1.42 MT"}
          subtext={kpis.oreStockpile?.subtext || "Valued @ ₹385/T • 6 Stockyards"}
          change={kpis.oreStockpile?.change || "+4.2%"}
          isPositive={kpis.oreStockpile?.isPositive ?? true}
          icon={Package}
          status={kpis.oreStockpile?.status || "Optimal"}
          onClick={() => navigate("/reserves")}
        />
        <KPICard
          title="Equipment Efficiency"
          value={kpis.equipmentEfficiency.value}
          subtext={kpis.equipmentEfficiency.subtext}
          change={kpis.equipmentEfficiency.change}
          isPositive={kpis.equipmentEfficiency.isPositive}
          icon={Zap}
          status={kpis.equipmentEfficiency.status}
          onClick={() => navigate("/equipment")}
        />
      </div>

      {/* Grid Row 2: Production Trend & Reserve Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Production Forecast & Historical Chart (2 Cols) */}
        <ChartCard
          title="Production Forecast & Target Analysis"
          subtitle="Comparing Historical Output vs AI Forecast & Target Threshold"
          className="lg:col-span-2"
          actions={
            <button
              onClick={() => navigate("/production")}
              className="text-xs font-semibold text-[#3498DB] hover:text-[#2980B9] transition-colors cursor-pointer"
            >
              Forecast Engine →
            </button>
          }
        >
          <div className="w-full pt-2 min-h-[340px]">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart
                data={productionTrends}
                margin={{ top: 15, right: 25, bottom: 15, left: 10 }}
              >
                <defs>
                  <linearGradient id="dashHistGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3498DB" stopOpacity={isDark ? 0.45 : 0.28} />
                    <stop offset="100%" stopColor="#3498DB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dashForeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#27AE60" stopOpacity={isDark ? 0.4 : 0.25} />
                    <stop offset="100%" stopColor="#27AE60" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke={isDark ? "#334155" : "#E2ECF6"}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="period"
                  stroke={isDark ? "#475569" : "#D8E6F3"}
                  tick={{ fontSize: 11, fill: isDark ? "#F1F5F9" : "#475569", fontWeight: isDark ? 600 : 500 }}
                  axisLine={{ stroke: isDark ? "#475569" : "#D8E6F3" }}
                  tickLine={false}
                />
                <YAxis
                  stroke={isDark ? "#475569" : "#D8E6F3"}
                  tick={{ fontSize: 11, fill: isDark ? "#F1F5F9" : "#475569", fontWeight: isDark ? 600 : 500 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[20000, 32000]}
                  ticks={[20000, 23000, 26000, 29000, 32000]}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k T`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0D1527" : "#FFFFFF",
                    borderColor: isDark ? "#334155" : "#D8E6F3",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    color: isDark ? "#FFFFFF" : "#1B2942",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
                  }}
                  itemStyle={{ padding: "3px 0", color: isDark ? "#F8FAFC" : "#1B2942" }}
                  formatter={(val, name) => [val != null ? `${Number(val).toLocaleString()} Tonnes` : "—", name]}
                />
                <Area
                  type="monotone"
                  dataKey="historical"
                  name="Historical Actuals"
                  stroke="#3498DB"
                  fill="url(#dashHistGrad)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#3498DB", stroke: isDark ? "#0D1527" : "#FFFFFF", strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                  connectNulls={true}
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  name="AI Forecast Output"
                  stroke="#27AE60"
                  fill="url(#dashForeGrad)"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: "#27AE60", stroke: isDark ? "#0D1527" : "#FFFFFF", strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                  connectNulls={true}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target Threshold"
                  stroke="#F1C40F"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "#F1C40F", stroke: isDark ? "#0D1527" : "#FFFFFF", strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                  connectNulls={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 mt-4 text-xs border-t border-[#EBF3FB] dark:border-[#1E293B] pt-4">
            <span className="flex items-center gap-2 font-bold text-[#1B2942] dark:text-white">
              <span className="w-3 h-3 rounded-full bg-[#3498DB] shadow-xs"></span> Historical Actuals
            </span>
            <span className="flex items-center gap-2 font-bold text-[#1B2942] dark:text-white">
              <span className="w-3 h-3 rounded-full bg-[#27AE60] shadow-xs"></span> AI Forecast
            </span>
            <span className="flex items-center gap-2 font-bold text-[#1B2942] dark:text-white">
              <span className="w-3 h-3 rounded-full bg-[#F1C40F] shadow-xs"></span> Target Threshold
            </span>
          </div>
        </ChartCard>

        {/* Reserve Potential Breakdown Donut Card */}
        <ChartCard
          title="Reserve Potential Distribution"
          subtitle="Estimated Total Potential: 2.84 Million Tonnes"
        >
          <div className="flex flex-col items-center justify-between h-full space-y-4">
            <div className="w-full h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reserveMatrix}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="percentage"
                    stroke={isDark ? "#131B2E" : "#FFFFFF"}
                    strokeWidth={3}
                    label={renderCustomizedLabel}
                    labelLine={false}
                  >
                    {reserveMatrix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#0D1527" : "#FFFFFF",
                      borderColor: isDark ? "#1E293B" : "#D8E6F3",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      color: isDark ? "#FFFFFF" : "#1B2942",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
                    }}
                    formatter={(val, name, props) => [`${props.payload.volumeMT} MT (${val}%)`, props.payload.category]}
                  />
                  {/* Central In-SVG Donut Labels (Guaranteed Always Centered & Visible) */}
                  <text
                    x="50%"
                    y="46%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isDark ? "#FFFFFF" : "#1B2942"}
                    className="donut-center-title select-none"
                    style={{
                      fontSize: "24px",
                      fontWeight: "900",
                      letterSpacing: "-0.02em",
                      fill: isDark ? "#FFFFFF" : "#1B2942",
                    }}
                  >
                    2.84 MT
                  </text>
                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isDark ? "#CBD5E1" : "#606F81"}
                    className="donut-center-sub select-none"
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      fill: isDark ? "#CBD5E1" : "#606F81",
                    }}
                  >
                    TOTAL RESERVE
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full space-y-2 text-xs">
              {reserveMatrix.map((item) => (
                <div
                  key={item.category}
                  className="reserve-pill flex items-center justify-between p-3 rounded-xl transition-all shadow-2xs border"
                  style={{
                    backgroundColor: isDark ? "#0D1527" : "#F8FBFE",
                    borderColor: isDark ? "#1E293B" : "#E2ECF6",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span
                      className="reserve-pill-text font-bold text-xs"
                      style={{ color: isDark ? "#FFFFFF" : "#1B2942" }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="reserve-pill-val font-extrabold text-xs"
                      style={{ color: isDark ? "#FFFFFF" : "#1B2942" }}
                    >
                      {item.volumeMT} MT
                    </span>
                    <span
                      className="font-mono font-bold text-xs px-2.5 py-0.5 rounded"
                      style={{
                        backgroundColor: isDark ? `${item.color}30` : `${item.color}1A`,
                        color: isDark ? "#FFFFFF" : item.color,
                        border: `1px solid ${item.color}50`,
                      }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Grid Row 3: Mining Zone Summary & Critical Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mining Zone Summary (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131B2E] border border-[#D8E6F3] dark:border-[#1E293B] rounded-xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#EBF3FB] dark:border-[#1E293B] pb-4">
            <div>
              <h4 className="text-sm font-bold text-[#1B2942] dark:text-white tracking-tight flex items-center gap-2">
                Mining Zone Intelligence Overview
              </h4>
              <p className="text-xs text-[#606F81] dark:text-[#94A3B8] mt-0.5">
                Active extraction sectors in primary ore belts
              </p>
            </div>
            <button
              onClick={() => navigate("/map")}
              className="text-xs font-semibold text-[#3498DB] hover:text-[#2980B9] transition-colors cursor-pointer"
            >
              Interactive GIS Map →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FBFE] dark:bg-[#0D1527] text-[#606F81] dark:text-[#94A3B8] uppercase tracking-wider font-semibold border-b border-[#D8E6F3] dark:border-[#1E293B] text-[10px]">
                  <th className="py-3 px-3.5">Zone ID</th>
                  <th className="py-3 px-3.5">Name & Region</th>
                  <th className="py-3 px-3.5">Reserve Potential</th>
                  <th className="py-3 px-3.5">Est. Reserve</th>
                  <th className="py-3 px-3.5">Ore Grade</th>
                  <th className="py-3 px-3.5">Shortfall Risk %</th>
                  <th className="py-3 px-3.5">Risk Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBF3FB] dark:divide-[#1E293B]">
                {zones.map((zone) => (
                  <tr
                    key={zone.id}
                    onClick={() => navigate(`/map?zone=${zone.id}`)}
                    className="hover:bg-[#F0F7FF] dark:hover:bg-[#152238] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-3.5 font-mono font-bold text-[#3498DB]">
                      {zone.id}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="font-semibold text-[#1B2942] dark:text-white">{zone.name}</div>
                      <div className="text-[11px] text-[#606F81] dark:text-[#94A3B8] mt-0.5">{zone.region}</div>
                    </td>
                    <td className="py-3.5 px-3.5 font-medium text-[#1B2942] dark:text-white">
                      <span className="font-bold text-[#1B2942] dark:text-white">{zone.potentialScore}%</span>{" "}
                      <span className="text-[#606F81] dark:text-[#94A3B8]">({zone.reservePotential})</span>
                    </td>
                    <td className="py-3.5 px-3.5 font-bold text-[#1B2942] dark:text-white">
                      {zone.estimatedReserveMT} MT
                    </td>
                    <td className="py-3.5 px-3.5 font-semibold text-[#1B2942] dark:text-white">
                      {formatGrade(zone.oreGradePercent)}
                    </td>
                    <td className="py-3.5 px-3.5">
                      {(() => {
                        const gap = (zone.targetProductionTonnes || 0) - (zone.currentProductionTonnes || 0);
                        const pct = zone.shortfallPercent || 0;
                        const isHigh = pct > 20;
                        const isMed = pct > 10;
                        const textColor = isHigh ? "text-[#E74C3C]" : isMed ? "text-[#F1C40F]" : "text-[#27AE60]";
                        const barColor = isHigh ? "bg-[#E74C3C]" : isMed ? "bg-[#F1C40F]" : "bg-[#27AE60]";

                        return (
                          <div className="flex flex-col gap-1 min-w-[130px]">
                            <div className="flex items-center justify-between gap-1.5 font-mono text-xs">
                              <span className={`font-extrabold ${textColor}`}>
                                {pct > 0 ? `-${gap > 0 ? gap.toLocaleString() : 0} T (${pct}%)` : "0 T (0%)"}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <RiskBadge risk={zone.riskLevel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clickable AI Alert Feed (1 Col) */}
        <div className="bg-white dark:bg-[#131B2E] border border-[#D8E6F3] dark:border-[#1E293B] rounded-xl p-6 space-y-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-[#EBF3FB] dark:border-[#1E293B] pb-4 mb-4">
              <h4 className="text-sm font-bold text-[#1B2942] dark:text-white tracking-tight">
                Live Mission Control Alerts
              </h4>
              <span className="text-[11px] font-semibold text-[#606F81] dark:text-[#94A3B8] bg-[#F0F7FF] dark:bg-[#152238] px-2.5 py-0.5 rounded border border-[#D8E6F3] dark:border-[#1E293B]">
                {alerts.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => {
                    if (alert.zoneId) navigate(`/map?zone=${alert.zoneId}`);
                    else if (alert.equipmentId) navigate(`/equipment?id=${alert.equipmentId}`);
                    else navigate("/insights");
                  }}
                  className="p-3.5 rounded-lg bg-[#F8FBFE] dark:bg-[#0D1527] border border-[#E2ECF6] dark:border-[#1E293B] hover:border-[#3498DB]/50 cursor-pointer transition-colors space-y-1.5 group shadow-2xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-[#3498DB] uppercase text-[10px]">
                      {alert.category}
                    </span>
                    <span className="text-[#606F81] dark:text-[#94A3B8] text-[10px]">{alert.timestamp}</span>
                  </div>
                  <h5 className="text-xs font-bold text-[#1B2942] dark:text-white group-hover:text-[#3498DB] transition-colors">
                    {alert.title}
                  </h5>
                  <p className="text-xs text-[#606F81] dark:text-[#CBD5E1] line-clamp-2 leading-relaxed">
                    {alert.message}
                  </p>
                  <div className="pt-1 text-[11px] font-semibold text-[#3498DB] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    {alert.actionText} →
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/insights")}
            className="w-full py-2.5 bg-[#F0F7FF] dark:bg-[#152238] hover:bg-[#E6F3FF] dark:hover:bg-[#1E293B] text-[#1B2942] dark:text-white text-xs font-semibold rounded-lg border border-[#D8E6F3] dark:border-[#1E293B] transition-colors mt-5 cursor-pointer"
          >
            View All AI Recommendations
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
