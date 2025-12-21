"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FloatingNav } from "@/components/landing/FloatingNav";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const CATEGORIES = [
  "Structural",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Safety",
  "Maintenance",
  "Cleanliness",
  "Network",
  "Furniture",
  "Other",
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

export default function PriorityPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PriorityScore | null>(null);

  const [formData, setFormData] = useState({
    category: "Other",
    severity: 5,
    description: "",
    buildingId: "",
    roomType: "classroom",
    // Impact factors
    blocksAccess: false,
    safetyRisk: false,
    criticalInfrastructure: false,
    affectsAcademics: false,
    weatherSensitive: false,
    // Context
    timeOfDay: "morning",
    dayOfWeek: "weekday",
    currentSemester: true,
    examPeriod: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("ciis_token") : null;
    
    if (!token) {
      toast.error("Please log in to access priority calculator");
      router.push("/login");
      return;
    }
    setIsAuthenticated(true);
  };

  const handleCalculate = async () => {
    setIsSubmitting(true);
    try {
      let token = window.localStorage.getItem("ciis_token");
      
      // Try to refresh token
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (e) {
          console.error("Token refresh failed", e);
        }
      }

      // Clean up empty fields
      const payload = {
        ...formData,
        buildingId: formData.buildingId || undefined,
        roomId: undefined, // Add if needed later
        reportedAt: new Date().toISOString(),
      };

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
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical": return "text-red-500";
      case "high": return "text-orange-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-white";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 60) return "text-orange-500";
    if (score >= 40) return "text-yellow-500";
    return "text-green-500";
  };

  if (!isAuthenticated) return null;

  return (
    <main className="relative min-h-screen bg-[#050814] text-white overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[36rem] h-[36rem] bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_55%,_#020617_100%)] opacity-60" />
      </div>

      <FloatingNav />

      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Priority <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">Engine</span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Simulate and calculate issue priorities using our AI-driven scoring algorithm.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-violet-500 rounded-full" />
                Input Parameters
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Severity (1-10): <span className="text-violet-400">{formData.severity}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>Minor</span>
                    <span>Major</span>
                    <span>Critical</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Impact Factors</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'safetyRisk', label: 'Safety Risk' },
                      { key: 'blocksAccess', label: 'Blocks Access' },
                      { key: 'criticalInfrastructure', label: 'Critical Infra' },
                      { key: 'affectsAcademics', label: 'Affects Academics' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition">
                        <input
                          type="checkbox"
                          checked={formData[key as keyof typeof formData] as boolean}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                          className="w-4 h-4 rounded border-white/20 bg-transparent text-violet-500 focus:ring-violet-500"
                        />
                        <span className="text-sm text-white/80">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Context</label>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={formData.timeOfDay}
                      onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                      className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-violet-500"
                    >
                      <option value="morning" className="bg-gray-900">Morning</option>
                      <option value="afternoon" className="bg-gray-900">Afternoon</option>
                      <option value="evening" className="bg-gray-900">Evening</option>
                      <option value="night" className="bg-gray-900">Night</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={formData.examPeriod}
                        onChange={(e) => setFormData({ ...formData, examPeriod: e.target.checked })}
                        className="rounded border-white/20 bg-transparent text-violet-500"
                      />
                      Exam Period
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={isSubmitting}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl transition shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Calculating..." : "Calculate Priority Score"}
                </button>
              </div>
            </motion.div>

            {/* Results Display */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {result ? (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 h-full">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-sky-500 rounded-full" />
                    Analysis Result
                  </h2>

                  <div className="flex items-center justify-between mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-sm text-white/50 mb-1">Priority Level</p>
                      <p className={`text-2xl font-bold uppercase tracking-wider ${getPriorityColor(result.priority)}`}>
                        {result.priority}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/50 mb-1">Score</p>
                      <p className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                        {Math.round(result.score)}
                        <span className="text-lg text-white/30 font-normal">/100</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider">Score Breakdown</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(result.breakdown).map(([key, value]) => (
                        <div key={key} className="bg-black/20 p-3 rounded-xl">
                          <div className="flex justify-between text-xs text-white/50 mb-1">
                            <span className="capitalize">{key.replace('Score', '')}</span>
                            <span>{Math.round(value as number)}</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5">
                            <div
                              className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((value as number) / 20 * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-3">AI Reasoning</h3>
                    <ul className="space-y-2">
                      {result.reasoning.map((reason, index) => (
                        <li key={index} className="flex gap-3 text-sm text-white/80">
                          <span className="text-sky-400 mt-1">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                    <span className="text-sm text-violet-200">Recommended SLA</span>
                    <span className="text-lg font-semibold text-violet-100">{result.recommendedSLA} Hours</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 h-full flex flex-col items-center justify-center text-center text-white/40">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p>Adjust parameters and click calculate to see the priority analysis.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}