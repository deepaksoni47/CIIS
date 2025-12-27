import { useState, useEffect } from "react";

interface User {
  uid: string;
  email: string;
  name?: string;
  role?: string;
  organizationId?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const userStr =
      typeof window !== "undefined"
        ? window.localStorage.getItem("campuscare_user")
        : null;

    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser({
          uid: userData.id || userData.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          organizationId: userData.organizationId,
        });
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }

    setLoading(false);
  }, []);

  return { user, loading };
}
