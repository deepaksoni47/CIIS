"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

interface GoogleSignInButtonProps {
  organizationId?: string;
}

export function GoogleSignInButton({
  organizationId = "ggv-bilaspur",
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // 1. Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 2. Get Firebase ID token
      const idToken = await user.getIdToken();

      // 3. Send token to backend (Google OAuth login)
      const response = await fetch(`${API_BASE_URL}/api/auth/login/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          organizationId,
          role: "student",
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        data?: { user: unknown; token: string };
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.success || !data.data?.token) {
        const message =
          data.message || data.error || "Unable to complete sign-in.";
        throw new Error(message);
      }

      // 4. Store user + token (backend echoes the Firebase ID token)
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ciis_token", data.data.token);
        window.localStorage.setItem(
          "ciis_user",
          JSON.stringify(data.data.user)
        );
      }

      // 5. Redirect to dashboard/console
      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unexpected error during Google sign-in.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-black/40 transition hover:bg-black/60 hover:border-white/30 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white">
          <img
            src="/google-icon.svg"
            alt="Google"
            className="h-3.5 w-3.5"
          />
        </span>
        <span>
          {isLoading ? "Connecting to Google..." : "Sign in with Google"}
        </span>
      </button>
      {error ? (
        <p className="text-xs text-rose-300 bg-rose-950/60 border border-rose-500/30 rounded-2xl px-3 py-2">
          {error}
        </p>
      ) : null}
    </div>
  );
}


