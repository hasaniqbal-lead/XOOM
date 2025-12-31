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
    draggable?: boolean;
    onClick?: () => void;
  }>;
  route?: Array<[number, number]>; // Route geometry as [lng, lat] pairs
  routeColor?: string;
  onMapClick?: (latlng: { lat: number; lng: number }) => void;
  onMarkerDrag?: (type: "pickup" | "dropoff", latlng: { lat: number; lng: number }) => void;
  className?: string;
  pinMode?: boolean;
}

const Map = ({
  center,
  zoom = 13,
  markers = [],
  route,
  routeColor = "#3b82f6",
  onMapClick,
  onMarkerDrag,
  className = "",
  pinMode = false,
}: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onMarkerDragRef = useRef(onMarkerDrag);

  // Keep callback refs updated
  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onMarkerDragRef.current = onMarkerDrag;
  }, [onMapClick, onMarkerDrag]);

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

    // Change cursor when in pin mode
    if (pinMode) {
      map.getContainer().style.cursor = 'crosshair';
    }

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

  // Update cursor based on pinMode
  useEffect(() => {
    if (mapInstanceRef.current) {
      const container = mapInstanceRef.current.getContainer();
      container.style.cursor = pinMode ? 'crosshair' : '';
    }
  }, [pinMode]);

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

      // Create custom icon with pulsing animation
      const pulseAnimation = markerData.draggable ? `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 ${iconColor}aa; }
          70% { box-shadow: 0 0 0 10px ${iconColor}00; }
          100% { box-shadow: 0 0 0 0 ${iconColor}00; }
        }
      ` : '';
      
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <style>${pulseAnimation}</style>
          <div style="
            background: ${iconColor};
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            animation: ${markerData.draggable ? 'pulse 2s infinite' : 'none'};
            transition: all 0.3s ease;
          ">
            <div style="
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(45deg);
              color: white;
              font-size: 18px;
              font-weight: bold;
            ">${markerData.type === "pickup" ? "📍" : markerData.type === "dropoff" ? "🎯" : "🚗"}</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker(markerData.position, { 
        icon: customIcon,
        draggable: markerData.draggable || false,
      }).addTo(
        mapInstanceRef.current!
      );

      if (markerData.label) {
        marker.bindPopup(markerData.label);
      }

      // Add drag event handler
      if (markerData.draggable) {
        marker.on('dragend', (e) => {
          const position = e.target.getLatLng();
          onMarkerDragRef.current?.(markerData.type, position);
        });
      }

      // Add click handler for marker
      if (markerData.onClick) {
        marker.on('click', markerData.onClick);
      }

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => m.position));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers]);

  // Update route
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove old route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    // Add new route
    if (route && route.length > 0) {
      // Convert from [lng, lat] to [lat, lng] for Leaflet
      const latLngs: L.LatLngExpression[] = route.map(coord => [coord[1], coord[0]]);

      const polyline = L.polyline(latLngs, {
        color: routeColor,
        weight: 5,
        opacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(mapInstanceRef.current);

      routeLayerRef.current = polyline;

      // Fit bounds to show entire route
      if (markers.length === 0) {
        mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }
    }
  }, [route, routeColor, markers.length]);

  return <div ref={mapRef} className={`w-full h-full ${className}`} />;
};

export default Map;
