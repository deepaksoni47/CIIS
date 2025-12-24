export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ciis_token");
}

export async function fetchWithAuth(input: string, init: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(
    input.startsWith("http") ? input : `${API_BASE_URL}${input}`,
    {
      ...init,
      headers,
    }
  );

  let data: any = {};
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  try {
    if (response.status === 401 || response.status === 403) {
      if (
        typeof window !== "undefined" &&
        (window as any).__CIIS_HANDLE_TOKEN_EXPIRED
      ) {
        try {
          (window as any).__CIIS_HANDLE_TOKEN_EXPIRED();
        } catch (e) {}
      }
    }
  } catch (e) {}

  if (!response.ok) {
    throw {
      response: {
        data: { message: data?.message || "Request failed" },
      },
    };
  }

  return { data };
}
