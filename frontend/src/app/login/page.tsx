"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { EmailSignInForm } from "@/components/auth/EmailSignInForm";
import { isTokenValid } from "@/lib/tokenManager";
import {
  COLLEGE_OPTIONS,
  DEFAULT_COLLEGE_ID,
  getCollegeByOrganizationId,
} from "@/data/colleges";

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"google" | "email">("google");
  const [registered, setRegistered] = useState<string | null>(null);
  const [selectedCollegeId, setSelectedCollegeId] =
    useState(DEFAULT_COLLEGE_ID);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use centralized token validation
      if (isTokenValid()) {
        router.replace("/dashboard");
        return;
      }

      // Read `registered` from the URL query string on client only
      try {
        const sp = new URLSearchParams(window.location.search);
        const reg = sp.get("registered");
        setRegistered(reg);
      } catch (e) {
        setRegistered(null);
      }
    }
  }, [router]);

  const selectedCollege =
    getCollegeByOrganizationId(selectedCollegeId) ||
    getCollegeByOrganizationId(DEFAULT_COLLEGE_ID) ||
    COLLEGE_OPTIONS[0];

  return (
    <main className="relative min-h-screen bg-[#050814] text-white overflow-hidden flex items-center justify-center px-4">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[36rem] h-[36rem] bg-fuchsia-500/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_55%,_#020617_100%)] opacity-60" />
      </div>

      <section className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Access your
            <span className="ml-2 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
              CampusCare Console
            </span>
          </h1>
          <p className="mt-3 text-sm text-white/60 max-w-sm mx-auto">
            Sign in with your campus Google account or email to view live
            infrastructure issues, heatmaps, and AI insights.
          </p>
        </div>

        <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_80px_rgba(79,70,229,0.35)] p-6 md:p-8 space-y-6">
          {registered === "1" && (
            <div className="mb-2 p-3 rounded-lg bg-green-900/40 border border-green-600 text-green-100">
              Account created successfully — please sign in with your new
              credentials.
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="college"
              className="block text-[11px] sm:text-xs font-medium text-white/70 uppercase tracking-[0.18em]"
            >
              College / University
            </label>
            <select
              id="college"
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-black/40 border border-white/10 text-white text-sm sm:text-base focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition min-w-0"
            >
              {COLLEGE_OPTIONS.map((college) => (
                <option
                  key={college.organizationId}
                  value={college.organizationId}
                >
                  {college.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] sm:text-xs text-white/60">
              We will link your account and center the heatmap around{" "}
              <span className="font-semibold text-violet-200">
                {selectedCollege?.name || "your campus"}
              </span>
              .
            </p>
          </div>
          {/* Authentication Method Tabs */}
          <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setAuthMethod("google")}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                authMethod === "google"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                </svg>
                Google
              </div>
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod("email")}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                authMethod === "email"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email
              </div>
            </button>
          </div>

          {authMethod === "google" ? (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/60 uppercase tracking-[0.18em]">
                  Single sign-on
                </p>
                <p className="text-sm text-white/70">
                  Use your verified Google identity. We'll automatically create
                  or link your CampusCare profile for{" "}
                  <span className="font-semibold text-violet-200">
                    {selectedCollege?.name || "your campus"}
                  </span>
                  .
                </p>
              </div>

              <GoogleSignInButton organizationId={selectedCollegeId} />
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/60 uppercase tracking-[0.18em]">
                  Email Authentication
                </p>
                <p className="text-sm text-white/70">
                  Sign in with your email and password, or create a new account
                  for{" "}
                  <span className="font-semibold text-violet-200">
                    {selectedCollege?.name || "your campus"}
                  </span>
                  .
                </p>
              </div>

              <EmailSignInForm organizationId={selectedCollegeId} />
            </>
          )}

          <p className="text-[11px] text-white/40 leading-relaxed">
            Authentication is powered by Firebase and Google OAuth as described
            in the CampusCare authentication guide. We never store your
            passwords.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Want to explore without signing in?{" "}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-violet-300 hover:text-violet-200 hover:underline decoration-dotted"
          >
            Back to public experience
          </button>
        </p>
      </section>
    </main>
  );
}
