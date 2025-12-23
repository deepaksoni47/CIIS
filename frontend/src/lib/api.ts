/**
 * Base API Client
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ciis_token");
}

/**
 * API Client with axios-like interface using fetch
 */
const api = {
  async get(
    endpoint: string,
    options: { params?: any; responseType?: "blob" } = {}
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

    const response = await fetch(url, { headers });

    if (options.responseType === "blob") {
      if (!response.ok) {
        throw new Error("Failed to download file");
      }
      return { data: await response.blob() };
    }

    const data = await response.json();

    if (!response.ok) {
      throw {
        response: {
          data: { message: data.message || "Request failed" },
        },
      };
    }

    return { data };
  },

  async post(endpoint: string, body?: any) {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        response: {
          data: { message: data.message || "Request failed" },
        },
      };
    }

    return { data };
  },

  async patch(endpoint: string, body?: any) {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        response: {
          data: { message: data.message || "Request failed" },
        },
      };
    }

    return { data };
  },

  async put(endpoint: string, body?: any) {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        response: {
          data: { message: data.message || "Request failed" },
        },
      };
    }

    return { data };
  },

  async delete(endpoint: string) {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        response: {
          data: { message: data.message || "Request failed" },
        },
      };
    }

    return { data };
  },
};

export default api;
