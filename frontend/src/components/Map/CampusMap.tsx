"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Issue {
  id: string;
  latitude: number;
  longitude: number;
  category: string;
  severity: number;
  description?: string;
}

interface CampusMapProps {
  issues: Issue[];
  center?: [number, number];
  zoom?: number;
}

export default function CampusMap({
  issues,
  center = [28.5494, 77.1917], // Default: Delhi, India (change to your campus)
  zoom = 15,
}: CampusMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prevent multiple map initializations
    if (mapRef.current !== null) return;
    if (!mapContainerRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles (100% FREE, no API key!)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, zoom]);

  // Update markers when issues change
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear existing markers (you might want to use a layer group)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for each issue
    issues.forEach((issue) => {
      // Custom marker color based on severity
      const color = getSeverityColor(issue.severity);

      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 12px;
          ">
            ${issue.severity}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([issue.latitude, issue.longitude], {
        icon: customIcon,
      }).addTo(map);

      // Add popup with issue details
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
            ${issue.category}
          </h3>
          <p style="margin: 0 0 4px 0;">
            <strong>Severity:</strong> ${issue.severity}/10
          </p>
          ${
            issue.description
              ? `
            <p style="margin: 4px 0 0 0; font-size: 14px;">
              ${issue.description}
            </p>
          `
              : ""
          }
        </div>
      `);
    });

    // Add heatmap effect (if you want to add heatmap library)
    // You can use leaflet.heat plugin: https://github.com/Leaflet/Leaflet.heat
  }, [issues]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ minHeight: "500px" }}
    />
  );
}

/**
 * Get color based on issue severity (1-10)
 */
function getSeverityColor(severity: number): string {
  if (severity >= 8) return "#dc2626"; // Red (critical)
  if (severity >= 6) return "#f59e0b"; // Orange (high)
  if (severity >= 4) return "#fbbf24"; // Yellow (medium)
  return "#10b981"; // Green (low)
}
