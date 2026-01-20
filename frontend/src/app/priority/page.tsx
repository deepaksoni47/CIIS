"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { VoteButton } from "@/components/voting/VoteButton";
import {
  Calculator,
  ListCheck,
  ChartNoAxesColumn,
  BrainCircuit,
  Shield,
  Building,
  Plug2,
  Droplets,
  AirVent,
  WifiPen,
  Brush,
  RockingChair,
  Dice1,
  Wrench,
  ChevronLeft, // Added
  ChevronRight, // Added
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

// Category configurations from Priority Engine
const CATEGORIES = [
  { value: "Safety", emoji: <Shield />, color: "from-red-600 to-rose-600" },
  {
    value: "Structural",
    emoji: <Building />,
    color: "from-orange-600 to-amber-600",
  },
  {
    value: "Electrical",
    emoji: <Plug2 />,
    color: "from-yellow-600 to-amber-600",
  },
  {
    value: "Plumbing",
    emoji: <Droplets />,
    color: "from-blue-600 to-cyan-600",
  },
  { value: "HVAC", emoji: <AirVent />, color: "from-cyan-600 to-teal-600" },
  {
    value: "Network",
    emoji: <WifiPen />,
    color: "from-violet-600 to-purple-600",
  },
  {
    value: "Maintenance",
    emoji: <Wrench />,
    color: "from-slate-600 to-gray-600",
  },
  {
    value: "Cleanliness",
    emoji: <Brush />,
    color: "from-green-600 to-emerald-600",
  },
  {
    value: "Furniture",
    emoji: <RockingChair />,
    color: "from-pink-600 to-rose-600",
  },
  { value: "Other", emoji: <Dice1 />, color: "from-gray-600 to-slate-600" },
] as const;

interface PriorityScore {
  score: number;
  priority: string;
  confidence: number;
  breakdown: {
    categoryScore: number;
    severityScore: number;
    impactScore: number;
    urgencyScore: number;
    contextScore: number;
    historicalScore: number;
  };
  reasoning: string[];
  recommendedSLA: number;
}

interface PriorityInput {
  category: string;
  severity: number;
  description?: string;
  buildingId?: string;
  occupancy?: number;
  affectedArea?: number;
  blocksAccess: boolean;
  safetyRisk: boolean;
  criticalInfrastructure: boolean;
  affectsAcademics: boolean;
  weatherSensitive: boolean;
  timeOfDay: string;
  dayOfWeek: string;
  currentSemester: boolean;
  examPeriod: boolean;
  isRecurring: boolean;
  previousOccurrences: number;
  reportedAt: string;
}

type ViewMode = "calculator" | "scenarios" | "explain" | "priority-list";

export default function PriorityPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("calculator");
  const [result, setResult] = useState<PriorityScore | null>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [algorithm, setAlgorithm] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [sortBy, setSortBy] = useState<"score" | "category" | "status">(
    "score",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // ------------------------

  const [formData, setFormData] = useState<PriorityInput>({
    category: "Safety",
    severity: 5,
    description: "",
    buildingId: "",
    occupancy: 0,
    affectedArea: 0,
    blocksAccess: false,
    safetyRisk: false,
    criticalInfrastructure: false,
    affectsAcademics: false,
    weatherSensitive: false,
    timeOfDay: "morning",
    dayOfWeek: "weekday",
    currentSemester: true,
    examPeriod: false,
    isRecurring: false,
    previousOccurrences: 0,
    reportedAt: new Date().toISOString(),
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("campuscare_token")
        : null;

    if (!token) {
      toast.error("Please log in to access priority engine");
      router.push("/login");
      return;
    }
    setIsAuthenticated(true);
  };

  const handleCalculate = async () => {
    setIsSubmitting(true);
    try {
      let token = window.localStorage.getItem("campuscare_token");

      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (e) {
          console.error("Token refresh failed", e);
        }
      }

      // Clean payload - only send non-default values
      const payload: any = {
        category: formData.category,
        reportedAt: formData.reportedAt,
      };

      if (formData.severity) payload.severity = formData.severity;
      if (formData.description) payload.description = formData.description;
      if (formData.buildingId) payload.buildingId = formData.buildingId;
      if (formData.occupancy != null && formData.occupancy > 0)
        payload.occupancy = formData.occupancy;
      if (formData.affectedArea != null && formData.affectedArea > 0)
        payload.affectedArea = formData.affectedArea;
      if (formData.blocksAccess) payload.blocksAccess = true;
      if (formData.safetyRisk) payload.safetyRisk = true;
      if (formData.criticalInfrastructure)
        payload.criticalInfrastructure = true;
      if (formData.affectsAcademics) payload.affectsAcademics = true;
      if (formData.weatherSensitive) payload.weatherSensitive = true;
      if (formData.timeOfDay) payload.timeOfDay = formData.timeOfDay;
      if (formData.dayOfWeek) payload.dayOfWeek = formData.dayOfWeek;
      if (formData.currentSemester) payload.currentSemester = true;
      if (formData.examPeriod) payload.examPeriod = true;
      if (formData.isRecurring) payload.isRecurring = true;
      if (formData.previousOccurrences > 0)
        payload.previousOccurrences = formData.previousOccurrences;

      const response = await fetch(`${API_BASE_URL}/api/priority/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.data);
        toast.success("Priority calculated successfully");
      } else {
        toast.error(data.message || "Failed to calculate priority");
      }
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadScenarios = async () => {
    try {
      let token = window.localStorage.getItem("campuscare_token");

      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const response = await fetch(`${API_BASE_URL}/api/priority/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setScenarios(data.data);
      }
    } catch (error) {
      console.error("Failed to load scenarios:", error);
    }
  };

  const loadAlgorithm = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/priority/explain`);
      const data = await response.json();

      if (response.ok && data.success) {
        setAlgorithm(data.data);
      }
    } catch (error) {
      console.error("Failed to load algorithm:", error);
    }
  };

  const loadIssues = async () => {
    setIsLoadingIssues(true);
    try {
      let token = window.localStorage.getItem("campuscare_token");
      const userStr = window.localStorage.getItem("campuscare_user");

      if (!userStr) {
        toast.error("User data not found. Please log in again.");
        return;
      }

      const userData = JSON.parse(userStr);
      const organizationId = userData.organizationId;

      if (!organizationId) {
        toast.error("Organization ID not found");
        return;
      }

      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const response = await fetch(
        `${API_BASE_URL}/api/issues?organizationId=${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      console.log("API Response:", {
        status: response.status,
        ok: response.ok,
        data: data,
        issuesCount: data.data?.length,
      });

      if (response.ok && data.success) {
        console.log("Setting issues:", data.data);
        setIssues(data.data || []);
      } else {
        console.error("API Error:", response.status, data);
        toast.error(
          data.message ||
            `Failed to load issues (${response.status}: ${response.statusText})`,
        );
        setIssues([]);
      }
    } catch (error) {
      console.error("Failed to load issues:", error);
      toast.error("Failed to connect to server. Is the backend running?");
      setIssues([]);
    } finally {
      setIsLoadingIssues(false);
    }
  };

  useEffect(() => {
    if (viewMode === "scenarios" && scenarios.length === 0) {
      loadScenarios();
    }
    if (viewMode === "explain" && !algorithm) {
      loadAlgorithm();
    }
    if (viewMode === "priority-list" && issues.length === 0) {
      loadIssues();
    }
  }, [viewMode]);

  // Reset page when sorting/filtering changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, sortOrder, issues.length]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "low":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      default:
        return "text-white bg-white/5 border-white/10";
    }
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-red-500 to-rose-600";
    if (score >= 60) return "from-orange-500 to-amber-600";
    if (score >= 40) return "from-yellow-500 to-amber-500";
    return "from-green-500 to-emerald-600";
  };

  // --- PAGINATION LOGIC ---
  const sortedIssues = [...issues].sort((a, b) => {
    if (sortBy === "score") {
      const scoreA = a.aiRiskScore || 0;
      const scoreB = b.aiRiskScore || 0;
      return sortOrder === "asc" ? scoreA - scoreB : scoreB - scoreA;
    } else if (sortBy === "category") {
      return sortOrder === "asc"
        ? a.category.localeCompare(b.category)
        : b.category.localeCompare(a.category);
    } else {
      return sortOrder === "asc"
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
  });

  const totalPages = Math.ceil(sortedIssues.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentIssues = sortedIssues.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  // ------------------------

  if (!isAuthenticated) return null;

  return (
    <main className="relative min-h-screen bg-[#050814] text-white overflow-hidden pb-20">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[36rem] h-[36rem] bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_55%,_#020617_100%)] opacity-60" />
      </div>

      <div className="container mx-auto px-4 pt-24 md:pt-32 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 md:mb-12"
          >
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Priority{" "}
              <span className="gradient-heading bg-clip-text text-transparent">
                Engine
              </span>
            </h1>
            <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
              Deterministic scoring system for campus infrastructure issue
              prioritization
            </p>
          </motion.div>

          {/* View Mode Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 "
          >
            {[
              { mode: "calculator", label: "Calculator", icon: <Calculator /> },
              {
                mode: "priority-list",
                label: "Priority List",
                icon: <ListCheck />,
              },
              {
                mode: "scenarios",
                label: "Scenarios",
                icon: <ChartNoAxesColumn />,
              },
              { mode: "explain", label: "Algorithm", icon: <BrainCircuit /> },
            ].map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as ViewMode)}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium transition-all text-sm md:text-base flex items-center justify-center gap-2 ${
                  viewMode === mode
                    ? "bg-gradient-to-r from-indigo-400 to-violet-800 text-white shadow-lg"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Calculator View */}
            {viewMode === "calculator" && (
              <motion.div
                key="calculator"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8"
              >
                {/* Input Form */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8">
                  <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-violet-500 rounded-full" />
                    Input Parameters
                  </h2>

                  <div className="space-y-6">
                    {/* Category Selection */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-3">
                        Issue Category
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            onClick={() =>
                              setFormData({ ...formData, category: cat.value })
                            }
                            // Added: flex, items-center, justify-center, gap-2
                            className={`p-3 rounded-xl border transition-all text-sm flex  justify-center gap-2 ${
                              formData.category === cat.value
                                ? `bg-gradient-to-r ${cat.color} border-transparent text-white shadow-lg`
                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                            }`}
                          >
                            {/* Icon */}
                            <span className="w-4 h-4">{cat.emoji}</span>
                            {/* Text */}
                            <span> </span>
                            <span>{cat.value}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Severity Slider */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Severity (1-10):{" "}
                        <span className="text-violet-400 font-bold">
                          {formData.severity}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.severity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            severity: parseInt(e.target.value),
                          })
                        }
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500"
                      />
                      <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>Minor</span>
                        <span>Moderate</span>
                        <span>Critical</span>
                      </div>
                    </div>

                    {/* Occupancy & Area */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Occupancy
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.occupancy}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              occupancy: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Area (sqm)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.affectedArea}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              affectedArea: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                        />
                      </div>
                    </div>

                    {/* Impact Factors */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-3">
                        Impact Factors
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { key: "safetyRisk", label: "⚠️ Safety Risk" },
                          { key: "blocksAccess", label: "🚫 Blocks Access" },
                          {
                            key: "criticalInfrastructure",
                            label: "⚡ Critical Infra",
                          },
                          {
                            key: "affectsAcademics",
                            label: "📚 Affects Academics",
                          },
                          {
                            key: "weatherSensitive",
                            label: "🌧️ Weather Sensitive",
                          },
                          {
                            key: "isRecurring",
                            label: "🔄 Recurring Issue",
                          },
                        ].map(({ key, label }) => (
                          <label
                            key={key}
                            className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10 transition"
                          >
                            <input
                              type="checkbox"
                              checked={
                                formData[key as keyof PriorityInput] as boolean
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  [key]: e.target.checked,
                                })
                              }
                              className="w-4 h-4 rounded border-white/20 bg-transparent text-violet-500 focus:ring-violet-500"
                            />
                            <span className="text-xs text-white/80">
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Context */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-3">
                        Context
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={formData.timeOfDay}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              timeOfDay: e.target.value,
                            })
                          }
                          className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-violet-500"
                        >
                          <option value="morning" className="bg-gray-900">
                            🌅 Morning
                          </option>
                          <option value="afternoon" className="bg-gray-900">
                            ☀️ Afternoon
                          </option>
                          <option value="evening" className="bg-gray-900">
                            🌆 Evening
                          </option>
                          <option value="night" className="bg-gray-900">
                            🌙 Night
                          </option>
                        </select>
                        <select
                          value={formData.dayOfWeek}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dayOfWeek: e.target.value,
                            })
                          }
                          className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-violet-500"
                        >
                          <option value="weekday" className="bg-gray-900">
                            📅 Weekday
                          </option>
                          <option value="weekend" className="bg-gray-900">
                            📅 Weekend
                          </option>
                        </select>
                        <label className="flex items-center gap-2 p-2 bg-white/5 rounded-lg text-sm text-white/70 col-span-1">
                          <input
                            type="checkbox"
                            checked={formData.currentSemester}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                currentSemester: e.target.checked,
                              })
                            }
                            className="rounded border-white/20 bg-transparent text-violet-500"
                          />
                          🎓 Semester
                        </label>
                        <label className="flex items-center gap-2 p-2 bg-white/5 rounded-lg text-sm text-white/70 col-span-1">
                          <input
                            type="checkbox"
                            checked={formData.examPeriod}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                examPeriod: e.target.checked,
                              })
                            }
                            className="rounded border-white/20 bg-transparent text-violet-500"
                          />
                          🗒️ Exam Period
                        </label>
                      </div>
                    </div>

                    {/* Previous Occurrences */}
                    {formData.isRecurring && (
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Previous Occurrences
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.previousOccurrences}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              previousOccurrences:
                                parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                        />
                      </div>
                    )}

                    <button
                      onClick={handleCalculate}
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-violet-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 text-white font-medium py-3 rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Calculating...
                        </span>
                      ) : (
                        "Calculate Priority Score"
                      )}
                    </button>
                  </div>
                </div>

                {/* Results Display */}
                <div className="space-y-6">
                  {result ? (
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8">
                      <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-sky-500 rounded-full" />
                        Analysis Result
                      </h2>

                      {/* Score & Priority */}
                      <div className="relative mb-8 p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 overflow-hidden">
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${getScoreGradient(
                            result.score
                          )} opacity-10`}
                        />
                        <div className="relative flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/50 mb-2">
                              Priority Level
                            </p>
                            <div
                              className={`inline-block px-4 py-2 rounded-xl border font-bold text-xl uppercase tracking-wider ${getPriorityColor(
                                result.priority
                              )}`}
                            >
                              {result.priority}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white/50 mb-2">Score</p>
                            <p
                              className={`text-5xl font-bold bg-gradient-to-br ${getScoreGradient(
                                result.score
                              )} bg-clip-text text-transparent`}
                            >
                              {Math.round(result.score)}
                              <span className="text-xl text-white/30 font-normal">
                                /100
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="relative mt-4 flex items-center justify-between text-sm">
                          <span className="text-white/60">
                            Confidence: {(result.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="text-white/60">
                            SLA: {result.recommendedSLA}h
                          </span>
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="mb-8">
                        <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">
                          Score Breakdown
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(result.breakdown).map(
                            ([key, value]) => (
                              <div key={key}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-white/70 capitalize">
                                    {key.replace("Score", "")}
                                  </span>
                                  <span className="text-white font-medium">
                                    {Math.round(value as number)}
                                  </span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${value}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(
                                      value as number
                                    )}`}
                                  />
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      <div>
                        <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-3">
                          Priority Reasoning
                        </h3>
                        <ul className="space-y-2">
                          {result.reasoning.map((reason, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex gap-3 text-sm text-white/80 p-3 bg-white/5 rounded-lg border border-white/5"
                            >
                              <span className="text-sky-400 font-bold">•</span>
                              <span>{reason}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center text-white/40">
                      <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                        <svg
                          className="w-10 h-10"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <p className="text-lg mb-2">Ready to Calculate</p>
                      <p className="text-sm">
                        Configure parameters and click calculate to see the
                        priority analysis
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Priority List View */}
            {viewMode === "priority-list" && (
              <motion.div
                key="priority-list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <h2 className="text-xl md:text-2xl font-bold">
                    All Issues by Priority
                  </h2>
                  <div className="flex items-center gap-4">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500"
                    >
                      <option value="score" className="bg-gray-900">
                        Sort by Score
                      </option>
                      <option value="category" className="bg-gray-900">
                        Sort by Category
                      </option>
                      <option value="status" className="bg-gray-900">
                        Sort by Status
                      </option>
                    </select>
                    <button
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition"
                    >
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </button>
                    <button
                      onClick={loadIssues}
                      disabled={isLoadingIssues}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm transition disabled:opacity-50"
                    >
                      {isLoadingIssues ? "Loading..." : "Refresh"}
                    </button>
                  </div>
                </div>

                {isLoadingIssues ? (
                  <div className="flex items-center justify-center py-20">
                    <svg
                      className="animate-spin h-8 w-8 text-violet-500"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                ) : issues.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10 text-left">
                          <th className="pb-3 text-sm font-medium text-white/70 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="pb-3 text-sm font-medium text-white/70 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="pb-3 text-sm font-medium text-white/70 uppercase tracking-wider hidden md:table-cell">
                            Category
                          </th>
                          <th className="pb-3 text-sm font-medium text-white/70 uppercase tracking-wider">
                            Issue
                          </th>
                          <th className="pb-3 text-sm font-medium text-white/70 uppercase tracking-wider hidden lg:table-cell">
                            Status
                          </th>
                          <th className="pb-3 text-sm font-medium text-white/70 uppercase tracking-wider">
                            Vote
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentIssues.map((issue, index) => {
                          const score = issue.aiRiskScore || 0;
                          const priority = issue.priority || "low";
                          return (
                            <motion.tr
                              key={issue.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className="border-b border-white/5 hover:bg-white/5 transition group"
                            >
                              <td className="py-4">
                                <div
                                  className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase ${getPriorityColor(
                                    priority
                                  )}`}
                                >
                                  {priority}
                                </div>
                              </td>
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-lg font-bold bg-gradient-to-br ${getScoreGradient(
                                      score
                                    )} bg-clip-text text-transparent`}
                                  >
                                    {Math.round(score)}
                                  </span>
                                  <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                                    <div
                                      className={`h-full bg-gradient-to-r ${getScoreGradient(
                                        score
                                      )}`}
                                      style={{ width: `${score}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 hidden md:table-cell">
                                <span className="text-sm text-white/70">
                                  {issue.category}
                                </span>
                              </td>
                              <td className="py-4">
                                <Link
                                  href={`/issues/${issue.id}`}
                                  className="block max-w-xs hover:text-violet-400 transition-colors"
                                >
                                  <p className="text-sm font-medium text-white truncate group-hover:text-violet-400 transition-colors">
                                    {issue.title}
                                  </p>
                                  <p className="text-xs text-white/50 truncate">
                                    {issue.description}
                                  </p>
                                </Link>
                              </td>
                              <td className="py-4 hidden lg:table-cell">
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs ${
                                    issue.status === "open"
                                      ? "bg-blue-500/10 text-blue-400"
                                      : issue.status === "in_progress"
                                      ? "bg-yellow-500/10 text-yellow-400"
                                      : issue.status === "resolved"
                                      ? "bg-green-500/10 text-green-400"
                                      : "bg-gray-500/10 text-gray-400"
                                  }`}
                                >
                                  {issue.status.replace("_", " ")}
                                </span>
                              </td>
                              <td className="py-4">
                                <VoteButton
                                  issueId={issue.id}
                                  initialVoteCount={issue.voteCount || 0}
                                  size="sm"
                                  showCount={true}
                                />
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {sortedIssues.length > itemsPerPage && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>
                        <span className="text-sm text-white/50">
                          Page <span className="text-white">{currentPage}</span>{" "}
                          of {totalPages}
                        </span>
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-white/40">
                    <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg mb-2">No Issues Found</p>
                    <p className="text-sm mb-4">
                      No issues have been reported yet for your organization
                    </p>
                    <button
                      onClick={() => router.push("/report")}
                      className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition text-sm"
                    >
                      Report Your First Issue
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Scenarios View */}
            {viewMode === "scenarios" && (
              <motion.div
                key="scenarios"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {scenarios.map((scenario, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
                  >
                    <h3 className="text-lg font-semibold mb-3 text-white">
                      {scenario.scenario}
                    </h3>
                    <div
                      className={`inline-block px-3 py-1 rounded-lg text-sm font-bold uppercase mb-4 ${getPriorityColor(
                        scenario.result.priority
                      )}`}
                    >
                      {scenario.result.priority}
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">Score</span>
                        <span className="text-white font-bold">
                          {Math.round(scenario.result.score)}/100
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(
                            scenario.result.score
                          )}`}
                          style={{ width: `${scenario.result.score}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-white/60 space-y-1">
                      {scenario.result.reasoning
                        .slice(0, 3)
                        .map((reason: string, i: number) => (
                          <p key={i}>• {reason}</p>
                        ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Algorithm Explanation View */}
            {viewMode === "explain" && algorithm && (
              <motion.div
                key="explain"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8"
              >
                <h2 className="text-2xl font-bold mb-6">
                  {algorithm.description}
                </h2>

                {/* Weights */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-white/90">
                    Scoring Weights
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(algorithm.algorithm.weights).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="bg-white/5 border border-white/10 rounded-xl p-4"
                        >
                          <p className="text-sm text-white/60 capitalize mb-1">
                            {key.replace("Score", "")}
                          </p>
                          <p className="text-2xl font-bold text-violet-400">
                            {String(value)}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Score Ranges */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-white/90">
                    Priority Ranges
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(algorithm.algorithm.scoreRanges).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className={`flex items-center justify-between p-4 rounded-xl border ${getPriorityColor(
                            key
                          )}`}
                        >
                          <span className="font-bold uppercase">{key}</span>
                          <span className="text-sm">{String(value)}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Boosters */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white/90">
                    Priority Boosters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(algorithm.boosters).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5"
                      >
                        <span className="text-sm text-white/70 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="text-sm font-bold text-green-400">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}