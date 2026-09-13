import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import MapView from "../components/map/MapView";
import ZoneDetailDrawer from "../components/map/ZoneDetailDrawer";
import FilterBar from "../components/common/FilterBar";
import LoadingState from "../components/common/LoadingState";
import Modal from "../components/common/Modal";
import { getMiningZones, createMiningZone, deleteMiningZone } from "../services/api";
import { MapPin, Search, Layers, Pickaxe, Plus, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

const INITIAL_ZONE_FORM = {
  zone_name: "",
  latitude: 21.65,
  longitude: 79.85,
  district: "Balaghat",
  state: "Madhya Pradesh",
  mineral_type: "Manganese",
  ore_grade: 42.0,
  estimated_reserve: 0.95,
  potential_level: "HIGH",
};

export const MapPage = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Add Zone Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [newZoneForm, setNewZoneForm] = useState({ ...INITIAL_ZONE_FORM });

  const [filters, setFilters] = useState({
    search: "",
    potential: "",
    risk: "",
  });

  const fetchZones = async () => {
    setLoading(true);
    try {
      const data = await getMiningZones();
      setZones(data);

      const paramZoneId = searchParams.get("zone");
      if (paramZoneId) {
        const matched = data.find((z) => z.id === paramZoneId);
        if (matched) {
          setSelectedZone(matched);
          setDrawerOpen(true);
        }
      }
    } catch (err) {
      console.error("Map zones fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, [searchParams]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ search: "", potential: "", risk: "" });
  };

  // Filter logic
  const filteredZones = zones.filter((z) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchName = z.name.toLowerCase().includes(q);
      const matchId = String(z.id).toLowerCase().includes(q);
      const matchRegion = z.region.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchRegion) return false;
    }
    if (filters.potential && z.reservePotential !== filters.potential) return false;
    if (filters.risk && z.riskLevel !== filters.risk) return false;
    return true;
  });

  const handleZoneSelect = (zone) => {
    setSelectedZone(zone);
    setDrawerOpen(true);
  };

  const handleViewAnalysis = (zone) => {
    navigate(`/reserves`);
  };

  const handleDeleteZone = async (zoneToDelete) => {
    if (!zoneToDelete) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete mining zone "${zoneToDelete.name}"?\n\nThis will remove its GIS boundaries and associated telemetry.`
    );
    if (!confirmDelete) return;

    try {
      await deleteMiningZone(zoneToDelete.numericId || zoneToDelete.id);
      setZones((prev) => prev.filter((z) => String(z.id) !== String(zoneToDelete.id)));
      if (selectedZone && String(selectedZone.id) === String(zoneToDelete.id)) {
        setSelectedZone(null);
        setDrawerOpen(false);
      }
    } catch (err) {
      console.error("Failed to delete zone:", err);
      alert(err.message || "Failed to delete mining zone. Please try again.");
    }
  };

  const handleCreateZoneSubmit = async (e) => {
    e.preventDefault();
    if (!newZoneForm.zone_name.trim()) {
      setFormError("Zone Name is required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const created = await createMiningZone(newZoneForm);
      setZones((prev) => [...prev, created]);
      setSelectedZone(created);
      setDrawerOpen(true);
      setIsAddModalOpen(false);
      setNewZoneForm({ ...INITIAL_ZONE_FORM });
    } catch (err) {
      console.error("Failed to add zone:", err);
      setFormError(err.message || "Failed to create mining zone. Please verify inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading MOIL GIS Spatial Map & Layer Telemetry..." />;
  }

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      {/* Top Controls & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#F0F7FF] text-[#3498DB] border border-[#D8E6F3]">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1B2942] tracking-tight">
              Interactive Mining GIS Map
            </h2>
            <p className="text-xs text-[#606F81]">
              Central Indian Manganese Belt • {zones.length} Active Mining Zones Mapped
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterBar
            filters={[
              {
                key: "search",
                type: "text",
                placeholder: "Search zone name/ID...",
              },
              {
                key: "potential",
                type: "select",
                label: "Potential",
                placeholder: "All Potential Ratings",
                options: [
                  { label: "High Potential", value: "HIGH" },
                  { label: "Medium Potential", value: "MEDIUM" },
                  { label: "Low Potential", value: "LOW" },
                ],
              },
              {
                key: "risk",
                type: "select",
                label: "Risk Level",
                placeholder: "All Risk Levels",
                options: [
                  { label: "Low Risk", value: "LOW" },
                  { label: "Medium Risk", value: "MEDIUM" },
                  { label: "High Risk", value: "HIGH" },
                ],
              },
            ]}
            values={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#3498DB] hover:bg-[#2980B9] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            Add Mining Zone
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 w-full relative min-h-0">
        <MapView
          zones={filteredZones}
          selectedZone={selectedZone}
          onZoneSelect={handleZoneSelect}
          onViewAnalysis={handleViewAnalysis}
        />
      </div>

      {/* Zone Detail Side Drawer */}
      <ZoneDetailDrawer
        zone={selectedZone}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onViewAnalysis={handleViewAnalysis}
        onDeleteZone={handleDeleteZone}
      />

      {/* Add Zone Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Manganese Mining Zone"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateZoneSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-[#FDEDEC] border border-[#E74C3C]/40 rounded-xl text-[#E74C3C] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1B2942] mb-1">
              Zone Name <span className="text-[#3498DB]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Balaghat South Extension"
              value={newZoneForm.zone_name}
              onChange={(e) => setNewZoneForm({ ...newZoneForm, zone_name: e.target.value })}
              className="w-full bg-[#F8FBFE] border border-[#D8E6F3] rounded-lg px-3 py-2 text-xs text-[#1B2942] placeholder-[#606F81] focus:outline-none focus:border-[#3498DB]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1B2942] mb-1">
                Latitude (°N) <span className="text-[#3498DB]">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={newZoneForm.latitude}
                onChange={(e) => setNewZoneForm({ ...newZoneForm, latitude: parseFloat(e.target.value) })}
                className="w-full bg-[#F8FBFE] border border-[#D8E6F3] rounded-lg px-3 py-2 text-xs text-[#1B2942] font-mono focus:outline-none focus:border-[#3498DB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1B2942] mb-1">
                Longitude (°E) <span className="text-[#3498DB]">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={newZoneForm.longitude}
                onChange={(e) => setNewZoneForm({ ...newZoneForm, longitude: parseFloat(e.target.value) })}
                className="w-full bg-[#F8FBFE] border border-[#D8E6F3] rounded-lg px-3 py-2 text-xs text-[#1B2942] font-mono focus:outline-none focus:border-[#3498DB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1B2942] mb-1">District</label>
              <input
                type="text"
                placeholder="e.g. Balaghat"
                value={newZoneForm.district}
                onChange={(e) => setNewZoneForm({ ...newZoneForm, district: e.target.value })}
                className="w-full bg-[#F8FBFE] border border-[#D8E6F3] rounded-lg px-3 py-2 text-xs text-[#1B2942] placeholder-[#606F81] focus:outline-none focus:border-[#3498DB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1B2942] mb-1">State</label>
              <input
                type="text"
                placeholder="e.g. Madhya Pradesh"
                value={newZoneForm.state}
                onChange={(e) => setNewZoneForm({ ...newZoneForm, state: e.target.value })}
                className="w-full bg-[#F8FBFE] border border-[#D8E6F3] rounded-lg px-3 py-2 text-xs text-[#1B2942] placeholder-[#606F81] focus:outline-none focus:border-[#3498DB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1B2942] mb-1">Ore Grade (% Mn)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={newZoneForm.ore_grade}
                onChange={(e) => setNewZoneForm({ ...newZoneForm, ore_grade: parseFloat(e.target.value) })}
                className="w-full bg-[#F8FBFE] border border-[#D8E6F3] rounded-lg px-3 py-2 text-xs text-[#1B2942] font-mono focus:outline-none focus:border-[#3498DB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1B2942] mb-1">Est. Reserve (MT)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newZoneForm.estimated_reserve}
                onChange={(e) => setNewZoneForm({ ...newZoneForm, estimated_reserve: parseFloat(e.target.value) })}
                className="w-full bg-[#F8FBFE] border border-[#D8E6F3] rounded-lg px-3 py-2 text-xs text-[#1B2942] font-mono focus:outline-none focus:border-[#3498DB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1B2942] mb-1">Potential Level</label>
              <select
                value={newZoneForm.potential_level}
                onChange={(e) => setNewZoneForm({ ...newZoneForm, potential_level: e.target.value })}
                className="w-full bg-[#F8FBFE] border border-[#D8E6F3] rounded-lg px-3 py-2 text-xs text-[#1B2942] focus:outline-none focus:border-[#3498DB] font-medium"
              >
                <option value="HIGH">High Potential</option>
                <option value="MEDIUM">Medium Potential</option>
                <option value="LOW">Low Potential</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBF3FB]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-[#606F81] border border-[#D8E6F3] text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#3498DB] hover:bg-[#2980B9] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {submitting ? "Registering..." : "Add Zone"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MapPage;
