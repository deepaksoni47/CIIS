/**
 * Token Manager
 * Centralized utility for token validation and cleanup to prevent redirect loops
 */

/**
 * Clear all authentication tokens and user data from storage
 * This should be called when tokens are invalid or expired
 */
export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem("campuscare_token");
    window.localStorage.removeItem("campuscare_user");

    // Dispatch custom event to notify other parts of the app
    window.dispatchEvent(new CustomEvent("campuscare:auth_cleared"));
  } catch (error) {
    console.error("Error clearing auth tokens:", error);
  }
}

/**
 * Validate stored token format
 * Returns true if token appears valid, false otherwise
 */
export function isTokenValid(): boolean {
  if (typeof window === "undefined") return false;

  const token = window.localStorage.getItem("campuscare_token");
  const userStr = window.localStorage.getItem("campuscare_user");

  // Both token and user data must exist
  if (!token || !userStr) return false;

  // Token must be a non-empty string
  if (typeof token !== "string" || token.trim().length === 0) {
    clearAuthTokens();
    return false;
  }

  // User data must be valid JSON
  try {
    JSON.parse(userStr);
  } catch (error) {
    clearAuthTokens();
    return false;
  }

  return true;
}

/**
 * Get stored token if it appears valid
 */
export function getValidToken(): string | null {
  if (!isTokenValid()) return null;
  return window.localStorage.getItem("campuscare_token");
}

/**
 * Get stored user data if it appears valid
 */
export function getValidUser(): Record<string, any> | null {
  if (!isTokenValid()) return null;

  try {
    const userStr = window.localStorage.getItem("campuscare_user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    clearAuthTokens();
    return null;
  }
}

/**
 * Handle authentication errors by clearing tokens
 * Call this when receiving 401/403 from API calls
 */
export function handleAuthError(statusCode: number): void {
  if (statusCode === 401 || statusCode === 403) {
    clearAuthTokens();
  }
}

/**
 * Set up a listener for token expiration events
 * Useful for logging out user when tokens expire
 */
export function setupAuthErrorListener(callback: () => void): () => void {
  const handleAuthCleared = () => {
    callback();
  };

  window.addEventListener("campuscare:auth_cleared", handleAuthCleared);

  // Return unsubscribe function
  return () => {
    window.removeEventListener("campuscare:auth_cleared", handleAuthCleared);
  };
}
