"use client";

import { useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  departmentId?: string;
  phone?: string;
}

interface ProfileInfoProps {
  user: User;
  onUpdate: (updatedUser: Partial<User>) => void;
}

export default function ProfileInfo({ user, onUpdate }: ProfileInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
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
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      onUpdate(formData);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
    });
    setIsEditing(false);
    setError(null);
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    facility_manager: "Facility Manager",
    staff: "Staff Member",
    faculty: "Faculty Member",
    student: "Student",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">
          Personal Information
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <div className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400">
            {user.email}
          </div>
          <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          ) : (
            <div className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white">
              {user.name}
            </div>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+1234567890"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white">
              {user.phone || "Not provided"}
            </div>
          )}
        </div>

        {/* Role (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Role
          </label>
          <div className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
              {roleLabels[user.role] || user.role}
            </span>
          </div>
        </div>

        {/* Organization (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Organization
          </label>
          <div className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white">
            {user.organizationId === "ggv-bilaspur"
              ? "GGV Bilaspur"
              : user.organizationId}
          </div>
        </div>

        {/* Department (Read-only) */}
        {user.departmentId && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Department
            </label>
            <div className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white">
              {user.departmentId}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
