/**
 * Base API Client
 */

import { fetchWithAuth } from "./fetchWithAuth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("campuscare_token");
}

/**
 * API Client with axios-like interface using fetch
 */
const api = {
  async get(
    endpoint: string,
    options: { params?: any; responseType?: "blob" } = {},
  ) {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let url = `${API_BASE_URL}${endpoint}`;
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const result = await fetchWithAuth(
      url,
      { method: "GET", headers },
      { responseType: options.responseType },
    );

    if (options.responseType === "blob") {
      return { data: result.data };
    }

    return { data: result.data };
  },

  async post(endpoint: string, body?: any) {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const result = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return { data: result.data };
  },

  async patch(endpoint: string, body?: any) {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const result = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return { data: result.data };
  },

  async put(endpoint: string, body?: any) {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const result = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return { data: result.data };
  },

  async delete(endpoint: string) {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const result = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    });

    return { data: result.data };
  },
};

export default api;
