import React from "react";
import { getStatusColor } from "../../utils/formatters";

export const StatusBadge = ({ status = "Active", className = "" }) => {
  const colorStyle = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};

export default StatusBadge;
