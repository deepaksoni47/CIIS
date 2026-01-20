"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

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
    category: "Other" as (typeof CATEGORIES)[number],
    buildingId: "",
    departmentId: "",
    roomId: "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [aiImageAnalysis, setAiImageAnalysis] = useState<string>("");
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const analyzingImageRef = useRef<boolean>(false); // Track if analysis is in progress
  const analyzedImageRef = useRef<string | null>(null); // Track last analyzed image name

  useEffect(() => {
    checkAuth();
    requestLocation();
  }, []);

  const checkAuth = () => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("campuscare_token")
        : null;
    const userStr =
      typeof window !== "undefined"
        ? window.localStorage.getItem("campuscare_user")
        : null;

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
            errorMessage =
              "Location access denied. Please enable location access to report issues.";
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
      },
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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

      // Automatically analyze the first image with AI (with deduplication)
      if (selectedFiles.length > 0) {
        const firstFile = selectedFiles[0];
        const fileKey = `${firstFile.name}-${firstFile.size}-${firstFile.lastModified}`;

        // Only analyze if we haven't analyzed this exact file yet and no analysis in progress
        if (
          !analyzingImageRef.current &&
          analyzedImageRef.current !== fileKey
        ) {
          analyzingImageRef.current = true;
          analyzedImageRef.current = fileKey;
          analyzeImageWithAI(firstFile).finally(() => {
            analyzingImageRef.current = false;
          });
        }
      }
    }
  };

  const analyzeImageWithAI = async (imageFile: File) => {
    setIsAnalyzingImage(true);
    try {
      const token = window.localStorage.getItem("campuscare_token");

      // First upload the image to get a URL
      const uploadFormData = new FormData();
      uploadFormData.append("images", imageFile);
      uploadFormData.append(
        "organizationId",
        user?.organizationId || "ggv-bilaspur",
      );

      const uploadResponse = await fetch(
        `${API_BASE_URL}/api/issues/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
        },
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        console.error("Image upload failed:", errorData);
        toast.error(
          "Image upload failed. You can still submit the issue without AI analysis.",
          { duration: 5000 },
        );
        return;
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.data?.url || uploadResult.data?.urls?.[0];

      if (!imageUrl) {
        toast("Image uploaded but AI analysis skipped.");
        return;
      }

      // Now analyze the image with AI
      const analyzeResponse = await fetch(
        `${API_BASE_URL}/api/ai/analyze-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl,
            buildingName: BUILDINGS.find((b) => b.id === formData.buildingId)
              ?.name,
          }),
        },
      );

      if (!analyzeResponse.ok) {
        const err = await analyzeResponse.json().catch(() => ({}));
        console.error("AI analysis failed:", err);

        // Handle rate limiting specifically
        if (analyzeResponse.status === 429) {
          toast.error(
            "AI service rate limit reached. Please wait a moment before trying again.",
            { duration: 6000 },
          );
        } else {
          toast.error(
            "AI analysis failed. You can still submit the issue without AI suggestions.",
          );
        }
        return;
      }

      const analyzeResult = await analyzeResponse.json();
      const analysis = analyzeResult.data?.analysis;

      if (analysis) {
        setAiImageAnalysis(analysis.description || "");

        // Auto-fill form fields based on AI analysis
        if (analysis.suggestedCategory) {
          setFormData((prev) => ({
            ...prev,
            category: analysis.suggestedCategory,
          }));
        }

        // Append AI description to user's description if empty
        if (analysis.description && !formData.description) {
          setFormData((prev) => ({
            ...prev,
            description: analysis.description,
          }));
        }

        toast.success("🤖 AI analyzed the image successfully!");
      }
    } catch (error) {
      console.error("Error analyzing image with AI:", error);
      toast.error("AI analysis failed, but you can still submit the issue");
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    // Clear AI analysis if removing all images
    if (imageFiles.length === 1) {
      setAiImageAnalysis("");
    }
  };

  // Voice recording functions using Web Speech API
  const startRecording = async () => {
    try {
      // Check if browser supports Speech Recognition
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        toast.error(
          "Speech recognition is not supported in your browser. Please type your issue instead.",
          { duration: 5000 },
        );
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let finalTranscript = "";
      let hasShownError = false; // Prevent duplicate error messages

      recognition.onresult = (event: any) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setVoiceTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        // Prevent duplicate error messages
        if (hasShownError) return;
        hasShownError = true;

        // Only log non-network/aborted errors to reduce console noise
        if (event.error !== "network" && event.error !== "aborted") {
          console.warn("Speech recognition error:", event.error);
        }

        // Only stop recording and cleanup on fatal errors
        const fatalErrors = [
          "not-allowed",
          "permission-denied",
          "audio-capture",
        ];

        if (fatalErrors.includes(event.error)) {
          setIsRecording(false);

          // Clean up media recorder if active
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            try {
              mediaRecorderRef.current.stop();
            } catch (e) {
              console.warn("Failed to stop media recorder on fatal error:", e);
            }
          }
        }

        // Show user-facing toasts for specific cases, but do not stop on transient errors
        if (event.error === "network") {
          // Suppress network error toast to avoid alarming users; recording will continue.
          console.info(
            "Speech recognition network error (suppressed):",
            event.error,
          );
        } else if (
          event.error === "not-allowed" ||
          event.error === "permission-denied"
        ) {
          toast.error(
            "Microphone permission denied. Please allow microphone access or type your issue.",
            { duration: 5000 },
          );
        } else if (event.error === "no-speech") {
          // Inform user but keep recording running so they can speak again
          toast("No speech detected. Listening...", { duration: 2000 });
        } else if (event.error === "audio-capture") {
          toast.error("No microphone found. Please use text input instead.", {
            duration: 5000,
          });
        }
        // Don't show toast for 'aborted' or other minor errors
      };

      recognition.onend = () => {
        if (isRecording) {
          // SpeechRecognition sessions can end after short pauses even when
          // `continuous` is true. Restart recognition automatically to allow
          // longer recordings until the user explicitly stops.
          console.log("Recognition ended unexpectedly, attempting restart");
          try {
            // Small delay before restart to avoid rapid loops
            setTimeout(() => {
              try {
                recognition.start();
              } catch (e) {
                console.warn("Recognition restart failed:", e);
              }
            }, 250);
          } catch (e) {
            console.warn("Error while restarting recognition:", e);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      toast.success("🎤 Recording started - speak now");

      // Also record audio for playback
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlobLocal = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audioBlobLocal);
        stream.getTracks().forEach((track) => track.stop());

        // Try server-side analysis when recording stops. If it fails,
        // fall back to client-side transcript processing in stopRecording().
        try {
          await sendAudioToServer(audioBlobLocal);
        } catch (err) {
          console.warn("Server-side voice analysis failed inside onstop:", err);
        }
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    toast("🎤 Recording stopped");

    // Process the transcript with AI to extract issue details
    // Server-side analysis is triggered from mediaRecorder.onstop; if that
    // didn't produce a transcription, fall back to client-side transcript.
    // Small delay to allow onstop handlers to run and populate `voiceTranscript`.
    await new Promise((r) => setTimeout(r, 200));

    if (voiceTranscript.trim()) {
      await processTranscriptWithAI(voiceTranscript);
    }
  };

  const processTranscriptWithAI = async (transcript: string) => {
    setIsProcessingVoice(true);
    try {
      const token = window.localStorage.getItem("campuscare_token");

      // Use the classify-text endpoint instead of process-voice
      const response = await fetch(`${API_BASE_URL}/api/ai/classify-text`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: transcript,
          buildingName: BUILDINGS.find((b) => b.id === formData.buildingId)
            ?.name,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const classification = result.data?.classification;

        if (classification) {
          // Auto-fill form with AI-extracted data
          setFormData((prev) => ({
            ...prev,
            title: classification.suggestedTitle || prev.title,
            description: classification.structuredDescription || transcript,
            category: classification.category || prev.category,
          }));

          toast.success("🤖 AI analyzed your voice input!");
        }
      } else {
        // If AI classification fails, just use the transcript
        toast("Using transcription as description");
        setFormData((prev) => ({
          ...prev,
          description: transcript,
        }));
      }
    } catch (error) {
      console.error("Error processing transcript with AI:", error);
      toast.error("AI processing failed, but transcript is saved");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Send recorded audio to backend for server-side voice analysis
  const sendAudioToServer = async (blob: Blob) => {
    setIsProcessingVoice(true);
    try {
      const token = window.localStorage.getItem("campuscare_token");
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string | null;
          if (!result) return resolve("");
          // Data URL format: data:<mime>;base64,<data>
          const parts = result.split(",");
          resolve(parts[1] || "");
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(blob);
      });

      const mimeType = blob.type || "audio/webm";

      const resp = await fetch(`${API_BASE_URL}/api/ai/process-voice`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType,
          buildingName: BUILDINGS.find((b) => b.id === formData.buildingId)
            ?.name,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error("Server voice analysis failed:", err);
        throw new Error(err.message || "Voice analysis failed");
      }

      const result = await resp.json();
      const data = result.data;

      // Update UI with transcription and AI classification
      if (data?.transcription) {
        setVoiceTranscript(data.transcription);
      }

      if (data?.issueClassification) {
        const classification = data.issueClassification;
        setFormData((prev) => ({
          ...prev,
          title: classification.suggestedTitle || prev.title,
          description: classification.structuredDescription || prev.description,
          category: classification.category || prev.category,
        }));

        toast.success("🤖 AI analyzed your voice input (server-side)!");
      } else {
        // Fallback: if no structured classification, use transcription as description
        if (data?.transcription) {
          setFormData((prev) => ({ ...prev, description: data.transcription }));
          toast("Using transcription as description");
        }
      }
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const clearVoiceRecording = () => {
    setAudioBlob(null);
    setVoiceTranscript("");
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    const token = window.localStorage.getItem("campuscare_token");
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
        toast.error(
          "Failed to upload images. You can still submit without images.",
        );
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error(
        "Error uploading images. You can still submit without images.",
      );
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
      let token = window.localStorage.getItem("campuscare_token");

      // Refresh token if possible
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
          // Update local storage
          window.localStorage.setItem("campuscare_token", token);
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
        submissionType: voiceTranscript
          ? imageUrls.length > 0
            ? "mixed"
            : "voice"
          : imageUrls.length > 0
            ? "image"
            : "text",
        images: imageUrls,
        voiceTranscript: voiceTranscript || undefined,
        aiImageAnalysis: aiImageAnalysis || undefined,
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
        setAiImageAnalysis("");
        setVoiceTranscript("");
        setAudioBlob(null);
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        const errorMessage =
          result.message || result.error || "Failed to report issue";
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
            <span className="gradient-heading">Report an Issue</span>
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
                    : location.error ||
                      "Please allow location access to continue"}
                </p>
              </div>
            </div>
            {(!location.latitude || !location.longitude) &&
              !location.isRequesting && (
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
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
            >
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

          {/* Voice Recording */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Voice Recording{" "}
              <span className="text-white/40 text-xs">
                (Optional - AI will transcribe)
              </span>
            </label>
            <div className="space-y-3">
              {/* Info banner */}
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5"
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
                <div className="flex-1">
                  <p className="text-xs text-amber-300">
                    <strong>⚠️ Note:</strong> Voice recognition is subject to
                    rate limiting.
                    <strong className="block mt-1">
                      Recommended: Just type your issue above instead.
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {!isRecording && !audioBlob && (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isProcessingVoice}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                    Start Recording
                  </button>
                )}

                {isRecording && (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex-1 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 border border-rose-500/30 transition-all text-white flex items-center justify-center gap-2 animate-pulse"
                  >
                    <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                    Stop Recording
                  </button>
                )}

                {audioBlob && !isRecording && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const url = URL.createObjectURL(audioBlob);
                        const audio = new Audio(url);
                        audio.play();
                      }}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white flex items-center justify-center gap-2"
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
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Play Recording
                    </button>
                    <button
                      type="button"
                      onClick={clearVoiceRecording}
                      className="px-4 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 transition-all text-rose-400 flex items-center justify-center"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {isProcessingVoice && (
                <div className="p-3 rounded-lg bg-violet-950/40 border border-violet-500/30 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></div>
                  <span className="text-sm text-violet-300">
                    AI is transcribing your voice...
                  </span>
                </div>
              )}

              {voiceTranscript && (
                <div className="p-4 rounded-lg bg-green-950/40 border border-green-500/30">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-300 mb-1">
                        Voice Transcription:
                      </p>
                      <p className="text-sm text-white/80">{voiceTranscript}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium mb-2"
            >
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
            <label
              htmlFor="buildingId"
              className="block text-sm font-medium mb-2"
            >
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
                <option
                  key={building.id}
                  value={building.id}
                  className="bg-[#1a1a2e]"
                >
                  {building.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department (Optional) */}
          <div>
            <label
              htmlFor="departmentId"
              className="block text-sm font-medium mb-2"
            >
              Department{" "}
              <span className="text-white/40 text-xs">(Optional)</span>
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
              Room Number{" "}
              <span className="text-white/40 text-xs">(Optional)</span>
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
              Images{" "}
              <span className="text-white/40 text-xs">
                (Optional, max 5 - AI will analyze)
              </span>
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
              {/* Camera input (single photo capture on mobile) */}
              <input
                ref={cameraInputRef as any}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzingImage}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isAnalyzingImage}
                  className="px-4 py-3 rounded-xl bg-white/6 border border-white/8 hover:bg-white/10 transition-all text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      d="M3 7h2l1-2h10l1 2h2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11a3 3 0 100 6 3 3 0 000-6z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Camera</span>
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-1">
                You can select images from your device or use the Camera button
                to take a new photo.
              </p>
              {aiImageAnalysis && (
                <div className="p-4 rounded-lg bg-blue-950/40 border border-blue-500/30">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-300 mb-1">
                        🤖 AI Image Analysis:
                      </p>
                      <p className="text-sm text-white/80">{aiImageAnalysis}</p>
                    </div>
                  </div>
                </div>
              )}

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
              disabled={
                isSubmitting || !location.latitude || !location.longitude
              }
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-violet-500  to-indigo-600 hover:from-indigo-600 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
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
