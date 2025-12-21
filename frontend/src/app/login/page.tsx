"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
      if (typeof window !== "undefined") {
        const existingToken = window.localStorage.getItem("ciis_token");
        if (existingToken) {
          router.replace("/dashboard");
        }
      }
  }, [router]);

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
              CIIS Console
            </span>
          </h1>
          <p className="mt-3 text-sm text-white/60 max-w-sm mx-auto">
            Sign in with your campus Google account to view live infrastructure
            issues, heatmaps, and AI insights.
          </p>
        </div>

        <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_80px_rgba(79,70,229,0.35)] p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-white/60 uppercase tracking-[0.18em]">
              Single sign-on
            </p>
            <p className="text-sm text-white/70">
              Use your verified Google identity. We’ll automatically create or
              link your CIIS profile for{" "}
              <span className="font-semibold text-violet-200">
                GGV Bilaspur
              </span>
              .
            </p>
          </div>

          <GoogleSignInButton organizationId="ggv-bilaspur" />

          <p className="text-[11px] text-white/40 leading-relaxed">
            Authentication is powered by Firebase and Google OAuth as described
            in the CIIS authentication guide. We never store your Google
            password on our servers.
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


