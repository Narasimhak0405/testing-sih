/**
 * Formatting utility functions for MANGANAI Mining Intelligence Platform
 */

export const formatTonnes = (val) => {
  if (val === null || val === undefined) return 'N/A';
  if (val >= 1000000) {
    return `${(val / 1000000).toFixed(2)} MT`;
  }
  return `${val.toLocaleString()} T`;
};

export const formatPercent = (val, decimals = 1) => {
  if (val === null || val === undefined) return 'N/A';
  return `${Number(val).toFixed(decimals)}%`;
};

export const formatGrade = (val) => {
  if (val === null || val === undefined) return 'N/A';
  return `${val}% Mn`;
};

export const getRiskColor = (risk) => {
  switch (String(risk).toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
      return 'bg-[#FDEDEC] text-[#E74C3C] border-[#E74C3C]/30';
    case 'MEDIUM':
    case 'MODERATE':
    case 'WARNING':
      return 'bg-[#FEF9E7] text-[#F39C12] border-[#F39C12]/30';
    case 'LOW':
    case 'OPTIMAL':
    case 'SAFE':
      return 'bg-[#E8F8F0] text-[#27AE60] border-[#27AE60]/30';
    default:
      return 'bg-[#F1F5F9] text-[#606F81] border-[#D8E6F3]';
  }
};

export const getStatusColor = (status) => {
  switch (String(status).toLowerCase()) {
    case 'active':
    case 'online':
    case 'optimal':
      return 'bg-[#E8F8F0] text-[#27AE60] border-[#27AE60]/30';
    case 'warning':
    case 'degraded':
      return 'bg-[#FEF9E7] text-[#F39C12] border-[#F39C12]/30';
    case 'shortfall risk':
    case 'risk':
      return 'bg-[#FDEDEC] text-[#E74C3C] border-[#E74C3C]/30';
    case 'maintenance':
    case 'servicing':
      return 'bg-[#EBF5FB] text-[#2980B9] border-[#2980B9]/30';
    case 'offline':
    case 'critical':
      return 'bg-[#FDEDEC] text-[#E74C3C] border-[#E74C3C]/30';
    default:
      return 'bg-[#F1F5F9] text-[#606F81] border-[#D8E6F3]';
  }
};

export const getPotentialBadgeStyle = (potential) => {
  switch (String(potential).toUpperCase()) {
    case 'HIGH':
      return 'bg-[#E8F8F0] text-[#27AE60] border-[#27AE60]/30 shadow-xs';
    case 'MEDIUM':
      return 'bg-[#FEF9E7] text-[#F39C12] border-[#F39C12]/30 shadow-xs';
    case 'LOW':
      return 'bg-[#F1F5F9] text-[#606F81] border-[#D8E6F3] shadow-xs';
    default:
      return 'bg-[#F1F5F9] text-[#606F81] border-[#D8E6F3]';
  }
};
