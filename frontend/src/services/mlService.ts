/**
 * ML Service (frontend)
 * Calls backend ML endpoints with auth when required
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("campuscare_token");
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function getMLHealth() {
  const res = await fetch(`${API_BASE_URL}/api/ml/health`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

export interface RiskScore {
  building_id: string;
  building_name?: string;
  risk_probability: number;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  failure_score: number | null;
  anomaly_score: number | null;
  recency_score: number | null;
  recommendations?: string[];
}

export async function getRiskScores(): Promise<
  { risk_scores: RiskScore[]; summary?: any } | any
> {
  const { getOrFetchPersistent } = await import("./persistentCache");
  return getOrFetchPersistent(
    "risk:scores",
    async () => {
      const res = await fetch(`${API_BASE_URL}/api/ml/risk`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      return res.json();
    },
    5 * 60 * 1000,
  );
}

export async function getCriticalBuildings() {
  const { getOrFetchPersistent } = await import("./persistentCache");
  return getOrFetchPersistent(
    "risk:critical-buildings",
    async () => {
      const res = await fetch(`${API_BASE_URL}/api/ml/critical-buildings`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      return res.json();
    },
    5 * 60 * 1000,
  );
}

export async function getHighRiskBuildings() {
  const { getOrFetchPersistent } = await import("./persistentCache");
  return getOrFetchPersistent(
    "risk:high-buildings",
    async () => {
      const res = await fetch(`${API_BASE_URL}/api/ml/high-risk-buildings`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      return res.json();
    },
    5 * 60 * 1000,
  );
}

export async function getCategoryRisks() {
  const { getOrFetchPersistent } = await import("./persistentCache");
  return getOrFetchPersistent(
    "risk:categories",
    async () => {
      const res = await fetch(`${API_BASE_URL}/api/ml/risk/category`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      return res.json();
    },
    5 * 60 * 1000,
  );
}

export async function getPriorityBuildings(limit = 10) {
  const params = new URLSearchParams({ limit: String(limit) });
  const { getOrFetchPersistent } = await import("./persistentCache");
  return getOrFetchPersistent(
    `risk:priority:${limit}`,
    async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/ml/risk/priority?${params}`,
        {
          headers: authHeaders(),
          cache: "no-store",
        },
      );
      return res.json();
    },
    5 * 60 * 1000,
  );
}

export async function getRiskReport() {
  const { getOrFetchPersistent } = await import("./persistentCache");
  return getOrFetchPersistent(
    "risk:report",
    async () => {
      const res = await fetch(`${API_BASE_URL}/api/ml/risk/report`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      return res.json();
    },
    10 * 60 * 1000,
  );
}

export async function getFailureRisks() {
  const { getOrFetchPersistent } = await import("./persistentCache");
  return getOrFetchPersistent(
    "risk:failure",
    async () => {
      const res = await fetch(`${API_BASE_URL}/api/ml/risk/failure`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      return res.json();
    },
    5 * 60 * 1000,
  );
}

export async function getAnomalyRisks() {
  const { getOrFetchPersistent } = await import("./persistentCache");
  return getOrFetchPersistent(
    "risk:anomaly",
    async () => {
      const res = await fetch(`${API_BASE_URL}/api/ml/risk/anomaly`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      return res.json();
    },
    5 * 60 * 1000,
  );
}

export async function getRecencyRisks() {
  const { getOrFetchPersistent } = await import("./persistentCache");
  return getOrFetchPersistent(
    "risk:recency",
    async () => {
      const res = await fetch(`${API_BASE_URL}/api/ml/risk/recency`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      return res.json();
    },
    5 * 60 * 1000,
  );
}
