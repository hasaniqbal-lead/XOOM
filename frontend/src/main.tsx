import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

// Register map cache service worker for offline capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/map-cache-sw.js')
      .then(registration => {
        console.log('🗺️  Map cache SW registered:', registration.scope);
      })
      .catch(error => {
        console.log('❌ Map cache SW registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
