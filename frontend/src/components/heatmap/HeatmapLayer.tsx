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
  minOpacity?: number;
  gradient?: Record<number, string>;
}

export function HeatmapLayer({
  points,
  radius = 25,
  blur = 15,
  maxZoom = 17,
  minOpacity = 0.05,
  gradient = {
    0.0: "blue",
    0.2: "cyan",
    0.4: "lime",
    0.6: "yellow",
    0.8: "orange",
    1.0: "red",
  },
}: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    // Convert points to leaflet.heat format: [lat, lng, intensity]
    const heatData = points.map((point) => [
      point.lat,
      point.lng,
      point.intensity,
    ]) as [number, number, number][];

    // Create heat layer
    const heatLayer = (L as any).heatLayer(heatData, {
      radius,
      blur,
      maxZoom,
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
  }, [map, points, radius, blur, maxZoom, minOpacity, gradient]);

  return null; // This component doesn't render anything
}

