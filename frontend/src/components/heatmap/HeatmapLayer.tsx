"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
// @ts-ignore - leaflet.heat doesn't have official types
import "leaflet.heat";

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1 normalized weight
}

interface HeatmapLayerProps {
  points: HeatmapPoint[];
  radius?: number;
  blur?: number;
  maxZoom?: number;
  max?: number;
  minOpacity?: number;
  gradient?: Record<number, string>;
}

export function HeatmapLayer({
  points,
  radius = 40,
  blur = 25,
  maxZoom = 17,
  minOpacity = 0.2,
  max = 1.5,
  gradient = {
    0.0: "#1e1b4b", // Dark indigo
    0.1: "#4c1d95", // Deep purple
    0.25: "#6d28d9", // Purple
    0.4: "#a855f7", // Light purple
    0.55: "#d946ef", // Fuchsia
    0.7: "#ec4899", // Pink
    0.82: "#f43f5e", // Rose
    0.92: "#ef4444", // Red
    1.0: "#dc2626", // Dark red
  },
}: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    // Convert points to leaflet.heat format: [lat, lng, intensity]
    // Amplify intensity values for better visualization
    const heatData = points.map((point) => [
      point.lat,
      point.lng,
      Math.pow(point.intensity, 0.7) * 1.5, // Power curve + amplification for better contrast
    ]) as [number, number, number][];

    // Create heat layer
    const heatLayer = (L as any).heatLayer(heatData, {
      radius,
      blur,
      maxZoom,
      max,
      minOpacity,
      gradient,
    });

    // Add to map
    heatLayer.addTo(map);

    // Cleanup on unmount or when points change
    return () => {
      if (map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points, radius, blur, maxZoom, max, minOpacity, gradient]);

  return null; // This component doesn't render anything
}
