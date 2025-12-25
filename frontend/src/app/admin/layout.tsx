"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    console.log("Admin Layout - User:", user);
    console.log("Admin Layout - User Role:", user?.role);

    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      console.log("Access denied - user role is not admin:", user.role);
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-4">
            You need admin privileges to access this page.
          </p>
          {user && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-gray-400 mb-1">Current Role:</p>
              <p className="text-white font-mono">{user.role || "undefined"}</p>
              <p className="text-sm text-gray-500 mt-2">
                Please contact an administrator to upgrade your account to admin
                role.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Issues", href: "/admin/issues", icon: FileText },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-gray-900 border-r border-gray-800 w-64`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8 px-3">
            <h2 className="text-xl font-bold gradient-heading bg-clip-text text-transparent">
              Admin Panel
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center p-3 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors group"
                >
                  <item.icon className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* User Info & Logout */}
          <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-800">
            <div className="flex items-center mb-3 px-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                {user.displayName?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">
                  {user.displayName || "Admin"}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full p-3 text-gray-300 rounded-lg hover:bg-red-900/20 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className={`fixed top-4 left-4 z-30 lg:hidden p-2 text-gray-400 bg-gray-900 rounded-lg hover:bg-gray-800 hover:text-white ${
          isSidebarOpen ? "hidden" : "block"
        }`}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div
        className={`${isSidebarOpen ? "lg:ml-64" : ""} transition-all duration-300`}
      >
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
