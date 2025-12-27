import { useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

/**
 * Custom hook for authentication management with automatic token refresh
 */
export function useAuth() {
  const router = useRouter();

  /**
   * Refresh the Firebase ID token
   */
  const refreshToken = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const newToken = await user.getIdToken(true);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("campuscare_token", newToken);
        }
        return newToken;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      await auth.signOut();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("campuscare_token");
        window.localStorage.removeItem("campuscare_user");
      }
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, [router]);

  /**
   * Get current user from localStorage
   */
  const getUser = useCallback(() => {
    if (typeof window !== "undefined") {
      const userStr = window.localStorage.getItem("campuscare_user");
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }, []);

  /**
   * Get current token from localStorage
   */
  const getToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("campuscare_token");
    }
    return null;
  }, []);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = useCallback(() => {
    return !!getToken();
  }, [getToken]);

  /**
   * Setup automatic token refresh
   * Firebase tokens expire after 1 hour, refresh every 50 minutes
   */
  useEffect(() => {
    const REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

    const interval = setInterval(() => {
      refreshToken();
    }, REFRESH_INTERVAL);

    // Also refresh on mount if user is logged in
    if (isAuthenticated()) {
      refreshToken();
    }

    return () => clearInterval(interval);
  }, [refreshToken, isAuthenticated]);

  /**
   * Listen to Firebase auth state changes
   */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in, ensure we have the latest token
        const token = await user.getIdToken();
        if (typeof window !== "undefined") {
          window.localStorage.setItem("campuscare_token", token);
        }
      } else {
        // User is signed out
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("campuscare_token");
          window.localStorage.removeItem("campuscare_user");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    refreshToken,
    logout,
    getUser,
    getToken,
    isAuthenticated,
  };
}
