import React from "react";
import { getRiskColor } from "../../utils/formatters";

export const RiskBadge = ({ risk = "LOW", className = "" }) => {
  const colorStyle = getRiskColor(risk);
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${colorStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {risk}
    </span>
  );
};

export default RiskBadge;
