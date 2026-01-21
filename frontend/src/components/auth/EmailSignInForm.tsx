"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  COLLEGE_OPTIONS,
  DEFAULT_COLLEGE_ID,
  getCollegeByOrganizationId,
} from "@/data/colleges";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface EmailSignInFormProps {
  organizationId?: string;
}

export function EmailSignInForm({
  organizationId = "ggv-bilaspur",
}: EmailSignInFormProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("student");
  const [selectedCollegeId, setSelectedCollegeId] = useState(
    organizationId || DEFAULT_COLLEGE_ID,
  );

  useEffect(() => {
    setSelectedCollegeId(organizationId || DEFAULT_COLLEGE_ID);
  }, [organizationId]);

  const selectedCollege =
    getCollegeByOrganizationId(selectedCollegeId) ||
    getCollegeByOrganizationId(DEFAULT_COLLEGE_ID) ||
    COLLEGE_OPTIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = isLogin
        ? `${API_BASE_URL}/api/auth/login`
        : `${API_BASE_URL}/api/auth/register`;

      const body = isLogin
        ? { email, password }
        : { email, password, name, organizationId: selectedCollegeId, role };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as {
        success?: boolean;
        data?: { user: any; token: string };
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.success || !data.data?.token) {
        const message = data.message || data.error || "Authentication failed.";
        throw new Error(message);
      }

      // Sign in to Firebase Auth client-side to maintain auth state
      await signInWithEmailAndPassword(auth, email, password);

      // Store token and user data for both login and registration
      if (typeof window !== "undefined") {
        window.localStorage.setItem("campuscare_token", data.data.token);
        window.localStorage.setItem(
          "campuscare_user",
          JSON.stringify(data.data.user),
        );
      }

      // Notify other components in this tab about auth change
      try {
        window.dispatchEvent(new Event("campuscare_auth_changed"));
      } catch (_) {
        /* ignore */
      }

      // Redirect to dashboard for both login and registration
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle Login/Register */}
      <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
        <button
          type="button"
          onClick={() => setIsLogin(true)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
            isLogin
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setIsLogin(false)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
            !isLogin
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name field (Register only) */}
        {!isLogin && (
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium text-white/70 mb-1.5"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition"
              placeholder="Enter your full name"
            />
          </div>
        )}

        {/* Email field */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-white/70 mb-1.5"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition"
            placeholder="you@example.com"
          />
        </div>

        {/* Password field */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-white/70 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition"
            placeholder="••••••••"
          />
          {!isLogin && (
            <p className="mt-1 text-xs text-white/40">Minimum 6 characters</p>
          )}
        </div>

        {/* Role selection (Register only) */}
        {!isLogin && (
          <div>
            <label
              htmlFor="role"
              className="block text-xs font-medium text-white/70 mb-1.5"
            >
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
              <option value="facility_manager">Facility Manager</option>
            </select>
            <p className="mt-1 text-xs text-white/40">
              Select your role in the organization
            </p>
          </div>
        )}

        {/* Organization info (Register only) */}
        {!isLogin && (
          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <p className="text-xs text-violet-300">
              <span className="font-semibold">Campus:</span>{" "}
              {selectedCollege.name}
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30">
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading
            ? isLogin
              ? "Signing in..."
              : "Creating account..."
            : isLogin
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>
    </div>
  );
}
