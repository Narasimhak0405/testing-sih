import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, Download } from "lucide-react";

export const DataTable = ({
  columns = [],
  data = [],
  onRowClick,
  pageSize = 6,
  searchPlaceholder = "Search records...",
  emptyMessage = "No records found.",
  actions,
  exportFilename = "mining_data_export",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // Export to CSV function
  const exportToCSV = () => {
    if (!data.length) return;
    const keys = columns.map((col) => col.key).filter(Boolean);
    const headers = columns.map((col) => col.header).join(",");
    const rows = data.map((row) =>
      keys.map((k) => `"${String(row[k] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${exportFilename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Search Filtering
  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    return sortDirection === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  // Handle Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key) => {
    if (sortField === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(key);
      setSortDirection("asc");
    }
  };

  return (
    <div className="bg-white dark:bg-[#131B2E] border border-[#D8E6F3] dark:border-[#1E293B] rounded-xl overflow-hidden shadow-xs flex flex-col">
      {/* Search & Actions Header */}
      <div className="p-3.5 border-b border-[#EBF3FB] dark:border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F8FBFE] dark:bg-[#0D1527]">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#606F81] dark:text-[#94A3B8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full bg-white dark:bg-[#152238] border border-[#D8E6F3] dark:border-[#1E293B] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#1B2942] dark:text-white placeholder-[#606F81] dark:placeholder-[#94A3B8] focus:outline-none focus:border-[#3498DB] focus:ring-1 focus:ring-[#3498DB]/30 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {actions}
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#152238] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-[#606F81] dark:text-[#CBD5E1] hover:text-[#1B2942] dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-[#D8E6F3] dark:border-[#1E293B] transition-colors cursor-pointer shadow-2xs"
            title="Export Table to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#3498DB]" />
            <span className="hidden sm:inline">CSV Export</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8FBFE] dark:bg-[#0D1527] text-[#606F81] dark:text-[#94A3B8] border-b border-[#D8E6F3] dark:border-[#1E293B] uppercase tracking-wider font-semibold text-[10px]">
              {columns.map((col) => (
                <th
                  key={col.key || col.header}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`py-3 px-4 ${
                    col.sortable ? "cursor-pointer hover:text-[#1B2942] dark:hover:text-white transition-colors" : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <ArrowUpDown className="w-3 h-3 text-[#606F81] dark:text-[#94A3B8]" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBF3FB] dark:divide-[#1E293B]">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-[#F0F7FF] dark:hover:bg-[#1A2640] transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key || col.header} className="py-3 px-4 text-[#1B2942] dark:text-white">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-[#606F81] dark:text-[#94A3B8] italic"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-[#EBF3FB] dark:border-[#1E293B] flex items-center justify-between text-xs text-[#606F81] dark:text-[#94A3B8] bg-[#F8FBFE] dark:bg-[#0D1527]">
        <div>
          Showing {paginatedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-1.5 rounded-md border border-[#D8E6F3] dark:border-[#1E293B] bg-white dark:bg-[#152238] text-[#1B2942] dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-[#1B2942] dark:text-white">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-1.5 rounded-md border border-[#D8E6F3] dark:border-[#1E293B] bg-white dark:bg-[#152238] text-[#1B2942] dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
