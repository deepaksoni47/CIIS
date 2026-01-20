"use client";

import { useState } from "react";

interface User {
  id: string;
  preferences?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    theme?: "light" | "dark" | "system";
    language?: string;
  };
}

interface UserPreferencesProps {
  user: User;
  onUpdate: (updatedUser: Partial<User>) => void;
}

export default function UserPreferences({
  user,
  onUpdate,
}: UserPreferencesProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [preferences, setPreferences] = useState({
    emailNotifications: user.preferences?.emailNotifications ?? true,
    pushNotifications: user.preferences?.pushNotifications ?? false,
    theme: user.preferences?.theme ?? "system",
    language: user.preferences?.language ?? "en",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("campuscare_token");
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update preferences");
      }

      onUpdate({ preferences });
      setSuccess("Preferences updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update preferences",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-6">Preferences</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Notifications Section */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            Notifications
          </h3>

          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex-1">
                <label className="text-white font-medium block mb-1">
                  Email Notifications
                </label>
                <p className="text-sm text-gray-400">
                  Receive email updates about issue status changes
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPreferences({
                    ...preferences,
                    emailNotifications: !preferences.emailNotifications,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.emailNotifications ? "bg-blue-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.emailNotifications
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex-1">
                <label className="text-white font-medium block mb-1">
                  Push Notifications
                </label>
                <p className="text-sm text-gray-400">
                  Receive push notifications in your browser
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPreferences({
                    ...preferences,
                    pushNotifications: !preferences.pushNotifications,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.pushNotifications ? "bg-blue-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.pushNotifications
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
            Appearance
          </h3>

          <div className="space-y-4">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPreferences({ ...preferences, theme: "light" })
                  }
                  className={`p-4 rounded-lg border-2 transition-all ${
                    preferences.theme === "light"
                      ? "border-blue-500 bg-blue-900/30"
                      : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
                  }`}
                >
                  <svg
                    className="w-8 h-8 mx-auto mb-2 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="text-sm text-white font-medium">Light</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPreferences({ ...preferences, theme: "dark" })
                  }
                  className={`p-4 rounded-lg border-2 transition-all ${
                    preferences.theme === "dark"
                      ? "border-blue-500 bg-blue-900/30"
                      : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
                  }`}
                >
                  <svg
                    className="w-8 h-8 mx-auto mb-2 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <span className="text-sm text-white font-medium">Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPreferences({ ...preferences, theme: "system" })
                  }
                  className={`p-4 rounded-lg border-2 transition-all ${
                    preferences.theme === "system"
                      ? "border-blue-500 bg-blue-900/30"
                      : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
                  }`}
                >
                  <svg
                    className="w-8 h-8 mx-auto mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm text-white font-medium">System</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                System theme follows your operating system&apos;s appearance
                settings
              </p>
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
            Language
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Interface Language
            </label>
            <select
              value={preferences.language}
              onChange={(e) =>
                setPreferences({ ...preferences, language: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-700">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            {loading ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}
