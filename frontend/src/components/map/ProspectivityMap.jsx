import React from "react";
import { MapContainer, TileLayer, Rectangle, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const classColor = (name) => {
  if (name === "HIGH") return "#E74C3C";
  if (name === "MODERATE") return "#F1C40F";
  return "#27AE60";
};

export default function ProspectivityMap({ data }) {
  if (!data?.cells?.length) return null;
  const [lat, lon] = data.study_area.center;
  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-[#D8E6F3] shadow-xs">
      <MapContainer center={[lat, lon]} zoom={11} scrollWheelZoom className="w-full h-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.cells.map((cell) => (
          <Rectangle
            key={cell.id}
            bounds={cell.bounds}
            pathOptions={{
              color: classColor(cell.class_name),
              fillColor: classColor(cell.class_name),
              fillOpacity: 0.38,
              weight: 1,
            }}
          >
            <Tooltip sticky>
              {cell.id}: {cell.class_name} ({cell.score}/100)
            </Tooltip>
            <Popup>
              <div className="text-xs space-y-1 text-[#1B2942]">
                <div className="font-bold text-sm">{cell.id} — {cell.class_name}</div>
                <div><b>Prospectivity:</b> {cell.score}/100</div>
                <div><b>Satellite:</b> {cell.satellite_score ?? "Unavailable"}</div>
                <div><b>Geology:</b> {cell.geology_score}/100</div>
                <div><b>Occurrence:</b> {cell.occurrence_score}/100</div>
                <div><b>Nearest reference:</b> {cell.nearest_reference}</div>
                <div><b>Distance:</b> {cell.distance_to_reference_km} km</div>
                <div className="pt-1 text-[10px] text-[#606F81]">Screening result — field sampling/XRF required for confirmation.</div>
              </div>
            </Popup>
          </Rectangle>
        ))}
        {data.reference_locations?.map((z) => (
          <CircleMarker
            key={`${z.name}-${z.latitude}-${z.longitude}`}
            center={[z.latitude, z.longitude]}
            radius={5}
            pathOptions={{ color: "#1B2942", fillColor: "#1B2942", fillOpacity: 0.9 }}
          >
            <Tooltip>{z.name} — known/reference manganese location</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 border border-[#D8E6F3] rounded-xl p-3 shadow-md text-[11px] text-[#1B2942]">
        <div className="font-bold mb-2">Prospectivity Screening</div>
        <div className="flex gap-3">
          <span><i className="inline-block w-3 h-3 rounded-sm mr-1" style={{background:"#E74C3C"}} />High</span>
          <span><i className="inline-block w-3 h-3 rounded-sm mr-1" style={{background:"#F1C40F"}} />Moderate</span>
          <span><i className="inline-block w-3 h-3 rounded-sm mr-1" style={{background:"#27AE60"}} />Low</span>
        </div>
      </div>
    </div>
  );
}
