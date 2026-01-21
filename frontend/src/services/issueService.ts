/**
 * Issue Service
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("campuscare_token");
}

/**
 * Update issue
 */
export async function updateIssue(issueId: string, updates: any) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/issues/${issueId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(updates),
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      response: {
        data: { message: data.message || "Failed to update issue" },
      },
    };
  }

  return data;
}

/**
 * Delete issue
 */
export async function deleteIssue(issueId: string) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/issues/${issueId}`, {
    method: "DELETE",
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      response: {
        data: { message: data.message || "Failed to delete issue" },
      },
    };
  }

  return data;
}
