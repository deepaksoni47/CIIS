"use client";

import { useEffect, useState } from "react";
import { getSystemAnalytics, SystemAnalytics } from "@/lib/adminService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30"); // days

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const data = await getSystemAnalytics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      setAnalytics(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!analytics) return null;

  const severityData = Object.entries(analytics.severityDistribution).map(
    ([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
    })
  );

  const categoryData = Object.entries(analytics.categoryDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      count: value,
    }));

  const buildingData = Object.entries(analytics.buildingDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, value]) => ({
      name: key,
      count: value,
    }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            System Analytics
          </h1>
          <p className="text-gray-400">Comprehensive insights and trends</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {analytics.totalIssues}
          </h3>
          <p className="text-gray-400 text-sm">Total Issues</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-green-400">
              {analytics.resolutionRate.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {analytics.resolvedIssues}
          </h3>
          <p className="text-gray-400 text-sm">Resolved Issues</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {analytics.avgResolutionTime.toFixed(1)}h
          </h3>
          <p className="text-gray-400 text-sm">Avg Resolution Time</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {analytics.severityDistribution.critical}
          </h3>
          <p className="text-gray-400 text-sm">Critical Issues</p>
        </div>
      </div>

      {/* Issues Trend */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Issues Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.issuesTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#fff",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Issues Reported"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Resolution Trend */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Resolution Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.resolutionTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#fff",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#10b981"
              strokeWidth={2}
              name="Issues Resolved"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            Severity Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "0.5rem",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Categories */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Top Categories</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "0.5rem",
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Buildings */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            Top Buildings by Issues
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={buildingData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#9ca3af"
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "0.5rem",
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            Statistics Summary
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Total Issues</span>
              <span className="text-white font-bold text-xl">
                {analytics.totalIssues}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Resolved Issues</span>
              <span className="text-green-400 font-bold text-xl">
                {analytics.resolvedIssues}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Resolution Rate</span>
              <span className="text-blue-400 font-bold text-xl">
                {analytics.resolutionRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Avg Resolution Time</span>
              <span className="text-purple-400 font-bold text-xl">
                {analytics.avgResolutionTime.toFixed(1)}h
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
