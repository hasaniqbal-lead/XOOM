import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";

// Fix Leaflet default marker icon issue with Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet icon paths with proper typing
interface LeafletIconDefault extends L.Icon.Default {
  _getIconUrl?: () => void;
}
delete (L.Icon.Default.prototype as LeafletIconDefault)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    type: "pickup" | "dropoff" | "driver";
    label?: string;
  }>;
  onMapClick?: (latlng: { lat: number; lng: number }) => void;
  className?: string;
}

const Map = ({
  center,
  zoom = 13,
  markers = [],
  onMapClick,
  className = "",
}: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const onMapClickRef = useRef(onMapClick);

  // Keep callback ref updated
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current).setView(center, zoom);

    // Add OpenStreetMap tile layer (FREE!)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add click handler
    map.on("click", (e) => {
      onMapClickRef.current?.(e.latlng);
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom]);

  // Update center when it changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, mapInstanceRef.current.getZoom());
    }
  }, [center]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const iconColor =
        markerData.type === "pickup" ? "#10b981" :
        markerData.type === "dropoff" ? "#ef4444" :
        "#3b82f6";

      // Create custom icon
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background: ${iconColor};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <div style="
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(45deg);
              color: white;
              font-size: 16px;
              font-weight: bold;
            ">${markerData.type === "pickup" ? "P" : markerData.type === "dropoff" ? "D" : "🚗"}</div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker(markerData.position, { icon: customIcon }).addTo(
        mapInstanceRef.current!
      );

      if (markerData.label) {
        marker.bindPopup(markerData.label);
      }

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => m.position));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers]);

  return <div ref={mapRef} className={`w-full h-full ${className}`} />;
};

export default Map;
