"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FloatingNav } from "@/components/landing/FloatingNav";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const CATEGORIES = [
  "Structural",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Safety",
  "Maintenance",
  "Cleanliness",
  "Network",
  "Furniture",
  "Other",
] as const;

const BUILDINGS = [
  { id: "building_001", name: "Main Administration Building" },
  { id: "building_002", name: "Engineering Block" },
  { id: "building_003", name: "Science Block" },
  { id: "building_004", name: "Library" },
  { id: "building_005", name: "Hostel Block A" },
  { id: "building_006", name: "Hostel Block B" },
  { id: "building_007", name: "Cafeteria" },
  { id: "building_008", name: "Sports Complex" },
  { id: "building_009", name: "Auditorium" },
  { id: "building_010", name: "Parking Area" },
];

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isRequesting: boolean;
}

export default function ReportPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isRequesting: false,
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other" as typeof CATEGORIES[number],
    buildingId: "",
    departmentId: "",
    roomId: "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
    requestLocation();
  }, []);

  const checkAuth = () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("ciis_token") : null;
    const userStr = typeof window !== "undefined" ? window.localStorage.getItem("ciis_user") : null;

    if (!token || !userStr) {
      toast.error("Please log in to report an issue");
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      toast.error("Invalid user data. Please log in again.");
      router.push("/login");
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
      }));
      return;
    }

    setLocation((prev) => ({ ...prev, isRequesting: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          isRequesting: false,
        });
        toast.success("Location access granted");
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location access to report issues.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setLocation((prev) => ({
          ...prev,
          error: errorMessage,
          isRequesting: false,
        }));
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Limit to 5 images
      const selectedFiles = files.slice(0, 5);
      setImageFiles(selectedFiles);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    const token = window.localStorage.getItem("ciis_token");
    const uploadedUrls: string[] = [];

    try {
      // Upload all images in one request (multer supports multiple files)
      const formData = new FormData();
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });
      formData.append("organizationId", user.organizationId || "ggv-bilaspur");

      const response = await fetch(`${API_BASE_URL}/api/issues/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header - browser will set it with boundary for FormData
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Backend might return single URL or array of URLs
          if (result.data?.url) {
            uploadedUrls.push(result.data.url);
          } else if (result.data?.urls && Array.isArray(result.data.urls)) {
            uploadedUrls.push(...result.data.urls);
          } else if (Array.isArray(result.data)) {
            uploadedUrls.push(...result.data);
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to upload images:", errorData);
        toast.error("Failed to upload images. You can still submit without images.");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Error uploading images. You can still submit without images.");
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim() || formData.title.length < 5) {
      toast.error("Title must be at least 5 characters");
      return;
    }

    if (!formData.description.trim() || formData.description.length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    if (!formData.buildingId) {
      toast.error("Please select a building");
      return;
    }

    if (!location.latitude || !location.longitude) {
      toast.error("Location is required. Please allow location access.");
      requestLocation();
      return;
    }

    setIsSubmitting(true);

    try {
      let token = window.localStorage.getItem("ciis_token");
      
      // Refresh token if possible
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
          // Update local storage
          window.localStorage.setItem("ciis_token", token);
        } catch (e) {
          console.error("Token refresh failed", e);
        }
      }

      // Upload images first if any
      const imageUrls = await uploadImages();

      // Prepare issue data
      const issueData = {
        organizationId: user.organizationId || "ggv-bilaspur",
        buildingId: formData.buildingId,
        departmentId: formData.departmentId || undefined,
        roomId: formData.roomId || undefined,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        submissionType: imageUrls.length > 0 ? "mixed" : "text",
        images: imageUrls,
      };

      // Submit issue
      const response = await fetch(`${API_BASE_URL}/api/issues`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Issue reported successfully!");
        // Reset form
        setFormData({
          title: "",
          description: "",
          category: "Other",
          buildingId: "",
          departmentId: "",
          roomId: "",
        });
        setImageFiles([]);
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        const errorMessage = result.message || result.error || "Failed to report issue";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error submitting issue:", error);
      toast.error("An error occurred while submitting the issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-[#050814]">
        <FloatingNav />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mb-4"></div>
            <p className="text-white/60">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050814] text-white">
      <FloatingNav />

      {/* Ambient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse-slower" />
      </div>

      <main className="pt-24 pb-12 px-4 md:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Report an
            <span className="ml-3 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
              Issue
            </span>
          </h1>
          <p className="text-white/60 text-lg">
            Help us maintain campus infrastructure by reporting issues
          </p>
        </motion.div>

        {/* Location Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-6 p-4 rounded-xl border ${
            location.latitude && location.longitude
              ? "bg-green-950/40 border-green-500/30"
              : location.error
              ? "bg-rose-950/40 border-rose-500/30"
              : "bg-yellow-950/40 border-yellow-500/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                {location.latitude && location.longitude ? (
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-white">
                  {location.latitude && location.longitude
                    ? "Location Access Granted"
                    : location.isRequesting
                    ? "Requesting Location..."
                    : location.error
                    ? "Location Access Required"
                    : "Requesting Location..."}
                </p>
                <p className="text-sm text-white/60">
                  {location.latitude && location.longitude
                    ? `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`
                    : location.error || "Please allow location access to continue"}
                </p>
              </div>
            </div>
            {(!location.latitude || !location.longitude) && !location.isRequesting && (
              <button
                onClick={requestLocation}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 space-y-6"
        >
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Issue Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              minLength={5}
              maxLength={200}
              placeholder="e.g., Broken water pipe in Engineering Block"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-white placeholder-white/40"
            />
            <p className="mt-1 text-xs text-white/40">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              minLength={10}
              maxLength={2000}
              rows={6}
              placeholder="Provide detailed information about the issue..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-white placeholder-white/40 resize-none"
            />
            <p className="mt-1 text-xs text-white/40">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category <span className="text-rose-400">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#1a1a2e]">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Building */}
          <div>
            <label htmlFor="buildingId" className="block text-sm font-medium mb-2">
              Building <span className="text-rose-400">*</span>
            </label>
            <select
              id="buildingId"
              name="buildingId"
              value={formData.buildingId}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-white"
            >
              <option value="" className="bg-[#1a1a2e]">
                Select a building
              </option>
              {BUILDINGS.map((building) => (
                <option key={building.id} value={building.id} className="bg-[#1a1a2e]">
                  {building.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department (Optional) */}
          <div>
            <label htmlFor="departmentId" className="block text-sm font-medium mb-2">
              Department <span className="text-white/40 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              id="departmentId"
              name="departmentId"
              value={formData.departmentId}
              onChange={handleInputChange}
              placeholder="e.g., Computer Science"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-white placeholder-white/40"
            />
          </div>

          {/* Room (Optional) */}
          <div>
            <label htmlFor="roomId" className="block text-sm font-medium mb-2">
              Room Number <span className="text-white/40 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              id="roomId"
              name="roomId"
              value={formData.roomId}
              onChange={handleInputChange}
              placeholder="e.g., 101, Lab-3"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-white placeholder-white/40"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Images <span className="text-white/40 text-xs">(Optional, max 5)</span>
            </label>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {imageFiles.length > 0
                  ? `${imageFiles.length} image(s) selected`
                  : "Add Images"}
              </button>
              {imageFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !location.latitude || !location.longitude}
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Submit Issue</span>
                </>
              )}
            </button>
            {(!location.latitude || !location.longitude) && (
              <p className="mt-2 text-xs text-rose-400 text-center">
                Location access is required to submit an issue
              </p>
            )}
          </div>
        </motion.form>
      </main>
    </div>
  );
}

