import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map = ({ center = [31.5204, 74.3587], zoom = 13, markers = [], onMapClick, className = '' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Add click handler
      if (onMapClick) {
        mapInstanceRef.current.on('click', (e) => {
          onMapClick(e.latlng);
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(({ lat, lng, popup, icon }) => {
      const markerIcon = icon ? L.icon(icon) : new L.Icon.Default();
      const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(mapInstanceRef.current);

      if (popup) {
        marker.bindPopup(popup);
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (markers.length === 1) {
      mapInstanceRef.current.setView([markers[0].lat, markers[0].lng], 15);
    }
  }, [markers]);

  return <div ref={mapRef} className={`w-full h-full ${className}`} />;
};

export default Map;
