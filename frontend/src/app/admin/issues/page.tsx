"use client";

import { useEffect, useState } from "react";
import {
  getAllIssues,
  exportIssues,
  PaginatedIssues,
} from "@/lib/adminService";
import { updateIssue, deleteIssue } from "@/services/issueService";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

const statusOptions = ["open", "in-progress", "resolved", "closed"];
const severityLevels = [
  { value: 1, label: "Low", color: "text-green-400" },
  { value: 2, label: "Medium", color: "text-yellow-400" },
  { value: 3, label: "High", color: "text-orange-400" },
  { value: 4, label: "Critical", color: "text-red-400" },
];

export default function AdminIssuesPage() {
  const [data, setData] = useState<PaginatedIssues | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadIssues();
  }, [search, statusFilter, severityFilter, categoryFilter, page]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const filters: any = { page, limit };
      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter;
      if (severityFilter) filters.severity = parseInt(severityFilter);
      if (categoryFilter) filters.category = categoryFilter;

      const result = await getAllIssues(filters);
      setData(result);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    try {
      await updateIssue(issueId, { status: newStatus });
      toast.success("Issue status updated");
      loadIssues();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;

    try {
      await deleteIssue(issueId);
      toast.success("Issue deleted successfully");
      loadIssues();
      if (showDetailsModal) setShowDetailsModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete issue");
    }
  };

  const handleExport = async (format: "json" | "csv") => {
    try {
      const filters: any = {};
      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter;
      if (severityFilter) filters.severity = parseInt(severityFilter);
      if (categoryFilter) filters.category = categoryFilter;

      const blob = await exportIssues(format, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `issues-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Issues exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error("Failed to export issues");
    }
  };

  const getSeverityBadge = (severity: number) => {
    const level = severityLevels.find((l) => l.value === severity);
    return (
      <span className={`font-medium ${level?.color || "text-gray-400"}`}>
        {level?.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-900/30 text-blue-400",
      "in-progress": "bg-yellow-900/30 text-yellow-400",
      resolved: "bg-green-900/30 text-green-400",
      closed: "bg-gray-700 text-gray-300",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || ""}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-20">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Issue Management
          </h1>
          <p className="text-gray-400">
            Monitor and manage all reported issues
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport("json")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All Severity</option>
            {severityLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setSeverityFilter("");
              setCategoryFilter("");
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Issues Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : data && data.issues.length > 0 ? (
          <>
            {data.issues.map((issue: any) => (
              <div
                key={issue.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {issue.title}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {issue.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{issue.buildingName || "Unknown Building"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                          {issue.reportedBy?.displayName || "Anonymous"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {getSeverityBadge(issue.severity)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-400 capitalize">
                        {issue.category}
                      </span>
                      {getStatusBadge(issue.status)}
                      {issue.voteCount > 0 && (
                        <span className="text-sm text-gray-400">
                          👍 {issue.voteCount}{" "}
                          {issue.voteCount === 1 ? "vote" : "votes"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex lg:flex-col gap-2">
                    <select
                      value={issue.status}
                      onChange={(e) =>
                        handleStatusChange(issue.id, e.target.value)
                      }
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setSelectedIssue(issue);
                        setShowDetailsModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors whitespace-nowrap"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => handleDeleteIssue(issue.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, data.pagination.total)} of{" "}
                {data.pagination.total} issues
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-white px-4">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                  }
                  disabled={page === data.pagination.totalPages}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-900 border border-gray-800 rounded-xl">
            <p className="text-lg">No issues found</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-2xl w-full my-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Issue Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {selectedIssue.title}
                </h3>
                <p className="text-gray-400">{selectedIssue.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  {getStatusBadge(selectedIssue.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Severity</p>
                  {getSeverityBadge(selectedIssue.severity)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="text-white capitalize">
                    {selectedIssue.category}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Building</p>
                  <p className="text-white">
                    {selectedIssue.buildingName || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Reported By</p>
                  <p className="text-white">
                    {selectedIssue.reportedBy?.displayName || "Anonymous"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created</p>
                  <p className="text-white">
                    {new Date(selectedIssue.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedIssue.images && selectedIssue.images.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-3">Images</p>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedIssue.images.map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Issue ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteIssue(selectedIssue.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
