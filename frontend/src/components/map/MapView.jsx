import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatTonnes, formatGrade } from "../../utils/formatters";
import RiskBadge from "../common/RiskBadge";
import { ExternalLink, Layers, Globe, Mountain } from "lucide-react";

// Direct reliable tile layers (100% free, no watermark, no API key required)
const TILE_LAYERS = {
  street: {
    name: "Street GIS",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    subdomains: "ab",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OSM</a>',
  },
  satellite: {
    name: "Satellite (Hybrid)",
    url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: "0123",
    attribution: '&copy; Google Satellite & Place Names',
  },
  terrain: {
    name: "Topographic",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
};

// Helper to get color based on potential
const getPotentialColor = (potential) => {
  switch (String(potential).toUpperCase()) {
    case "HIGH":
      return "#27AE60"; // Emerald Green (#27AE60)
    case "MEDIUM":
      return "#F1C40F"; // Amber Gold (#F1C40F)
    case "LOW":
      return "#E74C3C"; // Coral Red (#E74C3C)
    default:
      return "#3498DB";
  }
};

// Create custom SVG Leaflet Marker Icon
const createCustomIcon = (potential) => {
  const color = getPotentialColor(potential);
  return L.divIcon({
    className: "custom-map-marker",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: #ffffff;
        border: 2.5px solid ${color};
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(27, 41, 66, 0.25);
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: ${color};
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

export const MapView = ({
  zones = [],
  selectedZone = null,
  onZoneSelect,
  onViewAnalysis,
  center = [21.55, 79.7],
  zoom = 9,
}) => {
  const [map, setMap] = useState(null);
  const [activeLayer, setActiveLayer] = useState("street");

  useEffect(() => {
    if (map) {
      // Invalidate map size so Leaflet renders full bounds immediately
      const t = setTimeout(() => {
        map.invalidateSize();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [map]);

  useEffect(() => {
    if (map && selectedZone && selectedZone.coordinates) {
      map.flyTo(selectedZone.coordinates, 11, { duration: 1.5 });
    }
  }, [map, selectedZone]);

  const currentTileConfig = TILE_LAYERS[activeLayer] || TILE_LAYERS.street;

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-xl overflow-hidden border border-[#D8E6F3] shadow-xs bg-[#E6F3FF]">
      {/* Layer Switcher Toolbar */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-[#D8E6F3] shadow-md">
        <button
          onClick={() => setActiveLayer("street")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeLayer === "street"
              ? "bg-[#3498DB] text-white shadow-xs"
              : "text-[#606F81] hover:text-[#1B2942] hover:bg-slate-100"
          }`}
          title="Light Cartographic GIS"
        >
          <Layers className="w-3.5 h-3.5" />
          Street GIS
        </button>
        <button
          onClick={() => setActiveLayer("satellite")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeLayer === "satellite"
              ? "bg-[#3498DB] text-white shadow-xs"
              : "text-[#606F81] hover:text-[#1B2942] hover:bg-slate-100"
          }`}
          title="Satellite Imagery"
        >
          <Globe className="w-3.5 h-3.5" />
          Satellite
        </button>
        <button
          onClick={() => setActiveLayer("terrain")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeLayer === "terrain"
              ? "bg-[#3498DB] text-white shadow-xs"
              : "text-[#606F81] hover:text-[#1B2942] hover:bg-slate-100"
          }`}
          title="Topographic Relief"
        >
          <Mountain className="w-3.5 h-3.5" />
          Terrain
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        ref={setMap}
        className="w-full h-full min-h-[520px] z-0"
      >
        <TileLayer
          key={activeLayer}
          attribution={currentTileConfig.attribution}
          url={currentTileConfig.url}
          subdomains={currentTileConfig.subdomains || "abc"}
        />

        {zones.map((zone) => {
          const color = getPotentialColor(zone.reservePotential);
          const icon = createCustomIcon(zone.reservePotential);

          const [lat, lng] = zone.coordinates || [zone.lat, zone.lng];
          const polygonCoords = [
            [lat + 0.03, lng - 0.04],
            [lat + 0.04, lng + 0.03],
            [lat - 0.02, lng + 0.05],
            [lat - 0.04, lng - 0.02],
          ];

          const isSelected = selectedZone?.id === zone.id;

          return (
            <React.Fragment key={zone.id}>
              {/* Zone Geofence Boundary Polygon */}
              <Polygon
                positions={polygonCoords}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.35 : 0.15,
                  weight: isSelected ? 3 : 1.5,
                  dashArray: isSelected ? "" : "4, 4",
                }}
                eventHandlers={{
                  click: () => onZoneSelect && onZoneSelect(zone),
                }}
              >
                <Tooltip sticky direction="top">
                  <div className="text-xs font-bold text-[#1B2942] bg-white border border-[#D8E6F3] px-2 py-1 rounded shadow-sm">
                    {zone.name} ({zone.reservePotential} Potential)
                  </div>
                </Tooltip>
              </Polygon>

              {/* Marker Pin */}
              <Marker
                position={[lat, lng]}
                icon={icon}
                eventHandlers={{
                  click: () => onZoneSelect && onZoneSelect(zone),
                }}
              >
                <Popup>
                  <div className="p-1 space-y-2 text-[#1B2942] font-sans text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-[#EBF3FB] pb-2">
                      <span className="font-bold text-sm text-[#1B2942]">{zone.name}</span>
                      <RiskBadge risk={zone.riskLevel} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-1">
                      <div>
                        <span className="text-[10px] text-[#606F81] block uppercase font-semibold">
                          Reserve Potential
                        </span>
                        <span className="font-bold text-[#3498DB]">
                          {zone.potentialScore}% ({zone.reservePotential})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#606F81] block uppercase font-semibold">
                          Est. Reserve
                        </span>
                        <span className="font-bold text-[#1B2942]">{zone.estimatedReserveMT} MT</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#606F81] block uppercase font-semibold">
                          Ore Grade
                        </span>
                        <span className="font-bold text-[#27AE60]">{formatGrade(zone.oreGradePercent)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#606F81] block uppercase font-semibold">
                          Production
                        </span>
                        <span className="font-bold text-[#1B2942]">{formatTonnes(zone.currentProductionTonnes)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onViewAnalysis && onViewAnalysis(zone)}
                      className="w-full mt-2 py-2 px-3 bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View AI Analysis
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md border border-[#D8E6F3] p-3 rounded-xl shadow-md text-xs space-y-2">
        <div className="font-bold text-[#1B2942] flex items-center gap-1.5 border-b border-[#EBF3FB] pb-1.5">
          <Layers className="w-3.5 h-3.5 text-[#3498DB]" />
          Reserve Potential Legend
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#27AE60] shadow-2xs"></span>
            <span className="text-[#1B2942] font-medium">High Potential (&gt;80% Score)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F1C40F] shadow-2xs"></span>
            <span className="text-[#1B2942] font-medium">Medium Potential (60–80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#E74C3C] shadow-2xs"></span>
            <span className="text-[#1B2942] font-medium">Low Potential (&lt;60%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
