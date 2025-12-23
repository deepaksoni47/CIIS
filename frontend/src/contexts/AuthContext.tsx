"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: string;
  photoURL?: string;
  organizationId: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load user from localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("ciis_token");
      const userStr = localStorage.getItem("ciis_user");

      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch (error) {
          console.error("Failed to parse user data:", error);
          localStorage.removeItem("ciis_token");
          localStorage.removeItem("ciis_user");
        }
      }
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("ciis_token");
    localStorage.removeItem("ciis_user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
