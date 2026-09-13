import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Wrench, Zap, AlertTriangle, ShieldCheck, Clock, Activity, Thermometer, CheckCircle2, ChevronRight } from "lucide-react";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import Drawer from "../components/common/Drawer";
import FilterBar from "../components/common/FilterBar";
import LoadingState from "../components/common/LoadingState";
import { getEquipment } from "../services/api";

export const EquipmentPage = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
  });

  useEffect(() => {
    const fetchEq = async () => {
      setLoading(true);
      try {
        const data = await getEquipment();
        setEquipmentList(data);

        // Check query param e.g. /equipment?id=DR-004
        const paramId = searchParams.get("id");
        if (paramId) {
          const matched = data.find((e) => e.id === paramId);
          if (matched) {
            setSelectedItem(matched);
            setDrawerOpen(true);
          }
        }
      } catch (err) {
        console.error("Equipment fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEq();
  }, [searchParams]);

  const filteredEquipment = equipmentList.filter((eq) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchId = String(eq.id).toLowerCase().includes(q);
      const matchName = eq.name.toLowerCase().includes(q);
      const matchZone = eq.zoneName.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchZone) return false;
    }
    if (filters.status && eq.status !== filters.status) return false;
    if (filters.type && eq.type !== filters.type) return false;
    return true;
  });

  // Calculate fleet stats
  const totalUnits = equipmentList.length;
  const activeCount = equipmentList.filter((e) => e.status === "Active").length;
  const warningCount = equipmentList.filter((e) => e.status === "Warning").length;
  const maintenanceCount = equipmentList.filter((e) => e.status === "Maintenance").length;
  const offlineCount = equipmentList.filter((e) => e.status === "Offline").length;

  if (loading) {
    return <LoadingState message="Connecting to Heavy Fleet Telemetry Sensors..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-white border border-[#D8E6F3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B2942] tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#3498DB]" />
            Heavy Equipment Telemetry & Predictive Fleet Health
          </h2>
          <p className="text-xs text-[#606F81] mt-1">
            Real-time vibration monitoring, hydraulic pressure telemetry, and AI failure prediction for heavy mining units.
          </p>
        </div>

        {/* Fleet KPI Quick Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-lg bg-white border border-[#D8E6F3] text-[#606F81] shadow-2xs">
            Total Fleet: <strong className="text-[#1B2942]">{totalUnits}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#E8F8F0] border border-[#27AE60]/30 text-[#27AE60]">
            Active: <strong>{activeCount}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#FEF9E7] border border-[#F39C12]/30 text-[#F39C12]">
            Warning: <strong>{warningCount}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#EBF5FB] border border-[#3498DB]/30 text-[#3498DB]">
            Service: <strong>{maintenanceCount}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#FDEDEC] border border-[#E74C3C]/30 text-[#E74C3C]">
            Offline: <strong>{offlineCount}</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={[
          { key: "search", type: "text", placeholder: "Search equipment ID/name..." },
          {
            key: "status",
            type: "select",
            label: "Status",
            placeholder: "All Statuses",
            options: [
              { label: "Active", value: "Active" },
              { label: "Warning", value: "Warning" },
              { label: "Maintenance", value: "Maintenance" },
              { label: "Offline", value: "Offline" },
            ],
          },
          {
            key: "type",
            type: "select",
            label: "Type",
            placeholder: "All Equipment Types",
            options: [
              { label: "Excavators", value: "Excavator" },
              { label: "Heavy Drills", value: "Heavy Drill" },
              { label: "Haul Trucks", value: "Haul Truck" },
              { label: "Crushers", value: "Crusher" },
            ],
          },
        ]}
        values={filters}
        onChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        onReset={() => setFilters({ search: "", status: "", type: "" })}
      />

      {/* Fleet Data Table */}
      <DataTable
        columns={[
          {
            header: "Equipment ID",
            key: "id",
            sortable: true,
            render: (r) => (
              <span className="font-mono font-bold text-[#3498DB]">{r.id}</span>
            ),
          },
          {
            header: "Name & Type",
            key: "name",
            sortable: true,
            render: (r) => (
              <div>
                <div className="font-semibold text-[#1B2942] dark:text-white">{r.name}</div>
                <div className="text-[10px] text-[#606F81] dark:text-[#94A3B8] font-semibold">{r.type}</div>
              </div>
            ),
          },
          {
            header: "Mining Zone",
            key: "zoneName",
            sortable: true,
            render: (r) => <span className="font-medium text-[#1B2942] dark:text-white">{r.zoneName}</span>,
          },
          {
            header: "Status",
            key: "status",
            sortable: true,
            render: (r) => <StatusBadge status={r.status} />,
          },
          {
            header: "Health Score",
            key: "healthScore",
            sortable: true,
            render: (r) => (
              <div className="w-28 space-y-1">
                <div className="flex justify-between font-bold">
                  <span
                    className={
                      r.healthScore > 85
                        ? "text-[#27AE60]"
                        : r.healthScore > 65
                        ? "text-[#F39C12]"
                        : "text-[#E74C3C]"
                    }
                  >
                    {r.healthScore}%
                  </span>
                </div>
                <div className="w-full bg-[#EBF3FB] dark:bg-[#1E293B] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      r.healthScore > 85
                        ? "bg-[#27AE60]"
                        : r.healthScore > 65
                        ? "bg-[#F39C12]"
                        : "bg-[#E74C3C]"
                    }`}
                    style={{ width: `${r.healthScore}%` }}
                  />
                </div>
              </div>
            ),
          },
          {
            header: "Efficiency",
            key: "efficiencyPercent",
            sortable: true,
            render: (r) => <span className="font-bold text-[#1B2942] dark:text-white">{r.efficiencyPercent}%</span>,
          },
          {
            header: "Op Hours",
            key: "operatingHours",
            sortable: true,
            render: (r) => <span className="text-[#606F81] dark:text-[#CBD5E1]">{r.operatingHours.toLocaleString()} hrs</span>,
          },
          {
            header: "Maintenance Status",
            key: "maintenanceStatus",
            render: (r) => (
              <span className="text-[#606F81] dark:text-[#CBD5E1] font-medium text-[11px]">
                {r.maintenanceStatus}
              </span>
            ),
          },
        ]}
        data={filteredEquipment}
        onRowClick={(row) => {
          setSelectedItem(row);
          setDrawerOpen(true);
        }}
        pageSize={6}
        searchPlaceholder="Search heavy equipment..."
      />

      {/* Equipment Detailed Telemetry Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedItem ? `${selectedItem.id} Telemetry & Predictive Health` : "Equipment Details"}
        width="w-full max-w-lg"
      >
        {selectedItem && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#D8E6F3] space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#3498DB] bg-[#E6F3FF] px-2 py-0.5 rounded border border-[#D8E6F3]">
                  {selectedItem.id}
                </span>
                <StatusBadge status={selectedItem.status} />
              </div>
              <h3 className="text-base font-bold text-[#1B2942]">{selectedItem.name}</h3>
              <p className="text-xs text-[#606F81]">Deployed at: {selectedItem.zoneName}</p>
            </div>

            {/* Telemetry Gauge Cards Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#D8E6F3] space-y-1">
                <span className="text-[#606F81] text-[10px] uppercase font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3 text-[#3498DB]" /> Vibration Telemetry
                </span>
                <span className="text-lg font-bold text-[#1B2942]">{selectedItem.vibrationMmS} mm/s</span>
                <span className="text-[10px] text-[#606F81] block">
                  {selectedItem.vibrationMmS > 6.5 ? "Threshold Exceeded (>6.5)" : "Normal Range (<6.5)"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#D8E6F3] space-y-1">
                <span className="text-[#606F81] text-[10px] uppercase font-bold flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-[#E74C3C]" /> Thermal Index
                </span>
                <span className="text-lg font-bold text-[#1B2942]">{selectedItem.temperatureC} °C</span>
                <span className="text-[10px] text-[#606F81] block">
                  {selectedItem.temperatureC > 90 ? "High Heat Warning" : "Optimal Heat"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#D8E6F3] space-y-1">
                <span className="text-[#606F81] text-[10px] uppercase font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#3498DB]" /> Operating Hours
                </span>
                <span className="text-lg font-bold text-[#1B2942]">{selectedItem.operatingHours} hrs</span>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#D8E6F3] space-y-1">
                <span className="text-[#606F81] text-[10px] uppercase font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#27AE60]" /> Operational Efficiency
                </span>
                <span className="text-lg font-bold text-[#27AE60]">{selectedItem.efficiencyPercent}%</span>
              </div>
            </div>

            {/* Predictive Alert Warning Box */}
            {selectedItem.status === "Warning" || selectedItem.status === "Maintenance" ? (
              <div className="p-4 rounded-xl bg-[#FEF9E7] border border-[#F39C12]/30 text-xs space-y-1">
                <h5 className="font-bold text-[#F39C12] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#F39C12]" />
                  AI Predictive Failure Alert
                </h5>
                <p className="text-[#1B2942] leading-relaxed">
                  Bearing vibration level ({selectedItem.vibrationMmS} mm/s) indicates motor winding misalignment. Preventative overhaul recommended before scheduled date ({selectedItem.nextMaintenanceDate}).
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#E8F8F0] border border-[#27AE60]/30 text-xs space-y-1">
                <h5 className="font-bold text-[#27AE60] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#27AE60]" />
                  Optimal Fleet Condition
                </h5>
                <p className="text-[#1B2942]">
                  Unit telemetry within normal operational thresholds. Next routine inspection scheduled for {selectedItem.nextMaintenanceDate}.
                </p>
              </div>
            )}

            {/* Downtime History Log */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold uppercase text-[#606F81] text-[10px]">
                Downtime & Servicing Log
              </h4>

              {selectedItem.downtimeHistory && selectedItem.downtimeHistory.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedItem.downtimeHistory.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#F8FBFE] border border-[#E2ECF6] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#1B2942]">{log.reason}</div>
                        <div className="text-[10px] text-[#606F81]">{log.date}</div>
                      </div>
                      <span className="font-mono text-[#3498DB] font-bold">
                        {log.durationHours} hrs
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#F8FBFE] text-[#606F81] text-center italic border border-[#D8E6F3]">
                  No downtime events logged for this unit.
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default EquipmentPage;
