"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  getMLHealth,
  getRiskScores,
  getCriticalBuildings,
  getHighRiskBuildings,
  getCategoryRisks,
  getRiskReport,
  getFailureRisks,
  getAnomalyRisks,
  getRecencyRisks,
  RiskScore,
} from "@/services/mlService";
import { clearAllCaches } from "@/services/persistentCache";

function formatPct(n: number | null | undefined) {
  if (n === null || n === undefined || isNaN(n)) return "--";
  return `${(n * 100).toFixed(1)}%`;
}

function getBuildingDisplay(building: RiskScore): string {
  return building.building_name || building.building_id;
}

export default function RiskAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authOk, setAuthOk] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [health, setHealth] = useState<any>(null);
  const [scores, setScores] = useState<RiskScore[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [critical, setCritical] = useState<RiskScore[]>([]);
  const [high, setHigh] = useState<RiskScore[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [failureRisks, setFailureRisks] = useState<RiskScore[]>([]);
  const [anomalyRisks, setAnomalyRisks] = useState<RiskScore[]>([]);
  const [recencyRisks, setRecencyRisks] = useState<RiskScore[]>([]);

  useEffect(() => {
    // basic auth check via token
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("campuscare_token")
        : null;
    if (!token) {
      toast.error("Please log in to view ML analytics");
      router.push("/login");
      return;
    }
    setAuthOk(true);
  }, []);

  useEffect(() => {
    if (!authOk) return;

    const load = async () => {
      setLoading(true);
      try {
        const [h, rs, c, hi, cat, fr, ar, rr] = await Promise.all([
          getMLHealth(),
          getRiskScores(),
          getCriticalBuildings(),
          getHighRiskBuildings(),
          getCategoryRisks(),
          getFailureRisks(),
          getAnomalyRisks(),
          getRecencyRisks(),
        ]);

        setHealth(h);
        setScores(rs?.risk_scores || []);
        setSummary(rs?.summary || null);
        setCritical(c?.critical_buildings || []);
        setHigh(hi?.high_risk_buildings || []);
        setCategories(cat?.category_risks || []);
        setFailureRisks(fr?.scores || []);
        setAnomalyRisks(ar?.scores || []);
        setRecencyRisks(rr?.scores || []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load ML analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authOk]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      clearAllCaches("risk:");
      toast.success("Cache cleared. Refreshing analysis...");
      const [h, rs, c, hi, cat, fr, ar, rr] = await Promise.all([
        getMLHealth(),
        getRiskScores(),
        getCriticalBuildings(),
        getHighRiskBuildings(),
        getCategoryRisks(),
        getFailureRisks(),
        getAnomalyRisks(),
        getRecencyRisks(),
      ]);

      setHealth(h);
      setScores(rs?.risk_scores || []);
      setSummary(rs?.summary || null);
      setCritical(c?.critical_buildings || []);
      setHigh(hi?.high_risk_buildings || []);
      setCategories(cat?.category_risks || []);
      setFailureRisks(fr?.scores || []);
      setAnomalyRisks(ar?.scores || []);
      setRecencyRisks(rr?.scores || []);
      setScores(rs?.risk_scores || []);
      setSummary(rs?.summary || null);
      setCritical(c?.critical_buildings || []);
      setHigh(hi?.high_risk_buildings || []);
      setCategories(cat?.category_risks || []);
      toast.success("Analysis refreshed!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to refresh analysis");
    } finally {
      setRefreshing(false);
    }
  };

  if (!authOk) return null;

  return (
    <main className="min-h-screen bg-[#050814] text-white p-6 md:p-10 pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">ML Risk Analytics</h1>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                refreshing
                  ? "bg-white/10 text-white/50 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {refreshing ? "Refreshing..." : "Refresh Analysis"}
            </button>
            <Link
              href="/dashboard"
              className="text-sm text-white/60 hover:text-white transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Health */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/60">ML Service</div>
              <div className="text-lg font-semibold">
                {health?.status === "healthy" ? "Healthy" : "Unavailable"}
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs ${
                health?.status === "healthy"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              {health?.status || "unknown"}
            </div>
          </div>
        </section>

        {/* Summary cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/60">Total Buildings</div>
            <div className="text-2xl font-semibold">
              {summary?.total_buildings ?? scores.length}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/60">Critical</div>
            <div className="text-2xl font-semibold">
              {summary?.critical_count ?? critical.length}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/60">High</div>
            <div className="text-2xl font-semibold">
              {summary?.high_count ?? high.length}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/60">Avg Risk</div>
            <div className="text-2xl font-semibold">
              {summary?.average_risk != null
                ? formatPct(summary.average_risk)
                : "--"}
            </div>
          </div>
        </section>

        {/* Category risks */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Category Risks</h2>
            <span className="text-sm text-white/60">
              {categories?.length || 0} categories
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(categories || []).map((c: any) => (
              <div
                key={c.category}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="text-sm text-white/60">{c.category}</div>
                <div className="text-lg font-semibold mt-1">{c.risk_level}</div>
                <div className="text-white/60 text-xs mt-2">
                  Risk: {formatPct(c.risk_score)} • Issues: {c.num_issues} •
                  Severity:{" "}
                  {c.avg_severity != null ? c.avg_severity.toFixed(1) : "--"}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Raw scores table */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">All Building Scores</h2>
              <p className="text-xs text-white/50 mt-1">
                Complete risk assessment for all buildings
              </p>
            </div>
            <span className="text-sm text-white/60">
              {scores?.length || 0} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-white/60">
                <tr>
                  <th className="text-left py-2">Building</th>
                  <th className="text-left py-2">Risk</th>
                  <th className="text-left py-2">Level</th>
                  <th className="text-left py-2">Failure</th>
                  <th className="text-left py-2">Anomaly</th>
                  <th className="text-left py-2">Recency</th>
                </tr>
              </thead>
              <tbody>
                {(scores || []).map((s) => (
                  <tr key={s.building_id} className="border-t border-white/10">
                    <td className="py-2">{s.building_name || s.building_id}</td>
                    <td className="py-2">{formatPct(s.risk_probability)}</td>
                    <td className="py-2">{s.risk_level}</td>
                    <td className="py-2">{formatPct(s.failure_score)}</td>
                    <td className="py-2">{formatPct(s.anomaly_score)}</td>
                    <td className="py-2">{formatPct(s.recency_score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Failure Detection Model */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">⚙️ Failure Detection Model</h2>
              <p className="text-xs text-white/50 mt-1">
                Predicts buildings that are likely to have system failures or
                breakdowns. This model looks at equipment age, maintenance
                history, and wear patterns to identify buildings that might need
                repairs soon.
              </p>
            </div>
            <span className="text-sm text-white/60">
              {failureRisks?.length || 0} buildings
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-white/60">
                <tr>
                  <th className="text-left py-2">Building</th>
                  <th className="text-left py-2">Failure Score</th>
                  <th className="text-left py-2">Overall Risk</th>
                </tr>
              </thead>
              <tbody>
                {(failureRisks || []).map((b) => (
                  <tr key={b.building_id} className="border-t border-white/10">
                    <td className="py-2">{b.building_name || b.building_id}</td>
                    <td className="py-2 font-semibold text-blue-400">
                      {formatPct(b.failure_score)}
                    </td>
                    <td className="py-2">{formatPct(b.risk_probability)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Anomaly Detection Model */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">🔍 Anomaly Detection Model</h2>
              <p className="text-xs text-white/50 mt-1">
                Spots unusual patterns in building systems that might indicate
                hidden problems. Unlike the Failure Model, this catches strange
                behaviors that don't fit normal usage—like unexpected spikes in
                energy use or temperature changes.
              </p>
            </div>
            <span className="text-sm text-white/60">
              {anomalyRisks?.length || 0} buildings
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-white/60">
                <tr>
                  <th className="text-left py-2">Building</th>
                  <th className="text-left py-2">Anomaly Score</th>
                  <th className="text-left py-2">Overall Risk</th>
                </tr>
              </thead>
              <tbody>
                {(anomalyRisks || []).map((b) => (
                  <tr key={b.building_id} className="border-t border-white/10">
                    <td className="py-2">{b.building_name || b.building_id}</td>
                    <td className="py-2 font-semibold text-purple-400">
                      {formatPct(b.anomaly_score)}
                    </td>
                    <td className="py-2">{formatPct(b.risk_probability)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recency/Time-based Model */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">⏱️ Recency/Time-based Model</h2>
              <p className="text-xs text-white/50 mt-1">
                Prioritizes buildings that have had recent problems or haven't
                been serviced in a while. This model emphasizes "how urgent is
                this right now?"—buildings that were fine last month might need
                attention this week if something changed recently.
              </p>
            </div>
            <span className="text-sm text-white/60">
              {recencyRisks?.length || 0} buildings
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-white/60">
                <tr>
                  <th className="text-left py-2">Building</th>
                  <th className="text-left py-2">Recency Score</th>
                  <th className="text-left py-2">Overall Risk</th>
                </tr>
              </thead>
              <tbody>
                {(recencyRisks || []).map((b) => (
                  <tr key={b.building_id} className="border-t border-white/10">
                    <td className="py-2">{b.building_name || b.building_id}</td>
                    <td className="py-2 font-semibold text-green-400">
                      {formatPct(b.recency_score)}
                    </td>
                    <td className="py-2">{formatPct(b.risk_probability)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
