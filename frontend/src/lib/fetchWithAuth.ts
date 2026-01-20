import { auth } from "@/lib/firebase";
import { clearAuthTokens } from "@/lib/tokenManager";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("campuscare_token");
}

async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    if (auth && auth.currentUser) {
      const newToken = await auth.currentUser.getIdToken(true);
      if (newToken) {
        localStorage.setItem("campuscare_token", newToken);
        // Notify listeners that token refreshed
        try {
          window.dispatchEvent(
            new CustomEvent("campuscare:token_refreshed", {
              detail: { token: newToken },
            }),
          );
        } catch (e) {}
        return newToken;
      }
    }
  } catch (e) {
    console.warn("Token refresh failed:", e);
  }
  return null;
}

export async function fetchWithAuth(
  input: string,
  init: RequestInit = {},
  options: { responseType?: "blob" } = {},
) {
  const makeRequest = async (token?: string | null) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string>) || {}),
    };
    const effectiveToken = token ?? getAuthToken();
    if (effectiveToken) headers.Authorization = `Bearer ${effectiveToken}`;

    const response = await fetch(
      input.startsWith("http") ? input : `${API_BASE_URL}${input}`,
      {
        ...init,
        headers,
      },
    );

    return response;
  };

  let response = await makeRequest();

  // If unauthorized, try to refresh token and retry once
  if (response.status === 401 || response.status === 403) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      response = await makeRequest(newToken);
    } else {
      // Token refresh failed - clear stored credentials to prevent redirect loop
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("campuscare_token");
        window.localStorage.removeItem("campuscare_user");
      }

      // Call global handler if present
      if (
        typeof window !== "undefined" &&
        (window as any).__CAMPUSCARE_HANDLE_TOKEN_EXPIRED
      ) {
        try {
          (window as any).__CAMPUSCARE_HANDLE_TOKEN_EXPIRED();
        } catch (e) {}
      }
    }
  }

  if (options.responseType === "blob") {
    if (!response.ok) {
      let text = "";
      try {
        text = await response.text();
      } catch (e) {}
      throw {
        response: {
          data: { message: text || "Request failed" },
        },
      };
    }
    return { data: await response.blob() };
  }

  let data: any = {};
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  if (!response.ok) {
    throw {
      response: {
        data: { message: data?.message || "Request failed" },
      },
    };
  }

  return { data };
}
