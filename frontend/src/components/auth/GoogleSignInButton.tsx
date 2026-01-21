"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

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
        window.localStorage.setItem("campuscare_token", data.data.token);
        window.localStorage.setItem(
          "campuscare_user",
          JSON.stringify(data.data.user),
        );
        // Notify other components in this tab about auth change
        try {
          window.dispatchEvent(new Event("campuscare_auth_changed"));
        } catch (_) {
          /* ignore */
        }
      }

      // 5. Redirect to dashboard
      router.push("/dashboard");
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
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
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
