"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HeatmapLayer } from "./HeatmapLayer";
import { HeatmapSidebar } from "./HeatmapSidebar";
import { HeatmapLegend } from "./HeatmapLegend";

// Fix for default marker icons in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  issueCount?: number;
  avgSeverity?: number;
  categories?: string[];
}

interface HeatmapContainerProps {
  initialData?: HeatmapPoint[];
  center?: [number, number];
  zoom?: number;
  bounds?: [[number, number], [number, number]];
  onGenerateAIInsight?: () => Promise<void>;
  onFiltersChange?: (filters: {
    categories: string[];
    timeRange: "24h" | "7d" | "30d";
  }) => void;
}

// Component to handle zoom level changes
function ZoomHandler({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  return null;
}

export function HeatmapContainer({
  initialData = [],
  center = [28.5494, 77.1917], // Default: Delhi, India
  zoom = 15,
  bounds,
  onGenerateAIInsight,
  onFiltersChange,
}: HeatmapContainerProps) {
  const [layers, setLayers] = useState({
    water: true,
    power: true,
    wifi: true,
  });
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [showMarkers, setShowMarkers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>(initialData);

  // Map UI layer names to backend category names
  const layerCategoryMap: Record<string, string[]> = {
    water: ["Water", "Plumbing", "Drainage", "Water Supply"],
    power: ["Power", "Electrical", "Electricity", "Power Supply"],
    wifi: ["Wi-Fi", "Network", "Internet", "Connectivity", "WiFi"],
  };

  // Show individual markers when zoomed in past level 16
  useEffect(() => {
    setShowMarkers(currentZoom >= 16);
  }, [currentZoom]);

  // Update data when initialData changes
  useEffect(() => {
    setHeatmapData(initialData);
  }, [initialData]);

  // Filter heatmap data based on active layers
  const filteredData = useMemo(() => {
    if (!heatmapData.length) return [];
    
    // Filter by active layers (categories)
    return heatmapData.filter((point) => {
      if (!point.categories || point.categories.length === 0) {
        // If no categories, include if all layers are active
        return layers.water && layers.power && layers.wifi;
      }

      // Check if point's categories match any active layer
      const activeCategories: string[] = [];
      if (layers.water) activeCategories.push(...layerCategoryMap.water);
      if (layers.power) activeCategories.push(...layerCategoryMap.power);
      if (layers.wifi) activeCategories.push(...layerCategoryMap.wifi);

      return point.categories.some((cat) =>
        activeCategories.some((activeCat) =>
          cat.toLowerCase().includes(activeCat.toLowerCase())
        )
      );
    });
  }, [heatmapData, layers]);

  // Convert to heatmap format
  const heatmapPoints = useMemo(
    () =>
      filteredData.map((point) => ({
        lat: point.lat,
        lng: point.lng,
        intensity: point.intensity,
      })),
    [filteredData]
  );

  const handleLayerToggle = (layer: "water" | "power" | "wifi") => {
    setLayers((prev) => {
      const newLayers = { ...prev, [layer]: !prev[layer] };
      
      // Notify parent component of filter changes
      if (onFiltersChange) {
        const activeCategories: string[] = [];
        if (newLayers.water) activeCategories.push(...layerCategoryMap.water);
        if (newLayers.power) activeCategories.push(...layerCategoryMap.power);
        if (newLayers.wifi) activeCategories.push(...layerCategoryMap.wifi);
        
        onFiltersChange({
          categories: activeCategories,
          timeRange,
        });
      }
      
      return newLayers;
    });
  };

  const handleTimeRangeChange = (range: "24h" | "7d" | "30d") => {
    setTimeRange(range);
    
    // Notify parent component of filter changes
    if (onFiltersChange) {
      const activeCategories: string[] = [];
      if (layers.water) activeCategories.push(...layerCategoryMap.water);
      if (layers.power) activeCategories.push(...layerCategoryMap.power);
      if (layers.wifi) activeCategories.push(...layerCategoryMap.wifi);
      
      onFiltersChange({
        categories: activeCategories,
        timeRange: range,
      });
    }
  };

  const handleAIInsight = async () => {
    if (!onGenerateAIInsight) return;
    setIsLoading(true);
    try {
      await onGenerateAIInsight();
    } catch (error) {
      console.error("AI Insight error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        bounds={bounds}
        maxBounds={bounds}
        scrollWheelZoom={true}
      >
        {/* Dark theme tile layer (CartoDB Dark Matter) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Heatmap Layer */}
        {heatmapPoints.length > 0 && (
          <HeatmapLayer
            points={heatmapPoints}
            radius={25}
            blur={15}
            maxZoom={17}
            minOpacity={0.05}
          />
        )}

        {/* Individual Markers (when zoomed in) */}
        {showMarkers &&
          filteredData.map((point, index) => (
            <Marker key={index} position={[point.lat, point.lng]}>
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Infrastructure Issue
                  </h3>
                  {point.issueCount && (
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Issues:</strong> {point.issueCount}
                    </p>
                  )}
                  {point.avgSeverity && (
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Avg Severity:</strong> {point.avgSeverity.toFixed(1)}/10
                    </p>
                  )}
                  {point.categories && point.categories.length > 0 && (
                    <p className="text-sm text-gray-700">
                      <strong>Categories:</strong> {point.categories.join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Intensity: {(point.intensity * 100).toFixed(0)}%
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Zoom handler */}
        <ZoomHandler onZoomChange={setCurrentZoom} />
      </MapContainer>

      {/* Sidebar */}
      <HeatmapSidebar
        layers={layers}
        timeRange={timeRange}
        onLayerToggle={handleLayerToggle}
        onTimeRangeChange={handleTimeRangeChange}
        onClose={() => {}}
      />

      {/* Legend */}
      <HeatmapLegend />

      {/* AI Insight Button */}
      {onGenerateAIInsight && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAIInsight}
          disabled={isLoading}
          className="fixed top-24 right-6 z-[1000] px-6 py-3 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-fuchsia-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Analyzing...</span>
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
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span>Generate AI Insight</span>
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}

