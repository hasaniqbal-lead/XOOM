interface SavedLocation {
  id: string;
  type: 'home' | 'work' | 'recent' | 'favorite';
  name: string;
  address: string;
  lat: number;
  lng: number;
  timestamp: number;
}

const MAX_RECENT = 10;
const STORAGE_KEY = 'xoom_location_history';

class LocationHistoryService {
  // Get all saved locations
  getAll(): SavedLocation[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Save a location
  save(location: Omit<SavedLocation, 'id' | 'timestamp'>): void {
    const locations = this.getAll();
    const newLocation: SavedLocation = {
      ...location,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    // Remove duplicates (same lat/lng)
    const filtered = locations.filter(
      l => !(Math.abs(l.lat - newLocation.lat) < 0.0001 && Math.abs(l.lng - newLocation.lng) < 0.0001)
    );

    // Add new location at the beginning
    filtered.unshift(newLocation);

    // Keep only MAX_RECENT for recent locations
    const recent = filtered.filter(l => l.type === 'recent').slice(0, MAX_RECENT);
    const others = filtered.filter(l => l.type !== 'recent');

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...others, ...recent]));
  }

  // Get recent locations
  getRecent(): SavedLocation[] {
    return this.getAll()
      .filter(l => l.type === 'recent')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }

  // Get home location
  getHome(): SavedLocation | null {
    return this.getAll().find(l => l.type === 'home') || null;
  }

  // Get work location
  getWork(): SavedLocation | null {
    return this.getAll().find(l => l.type === 'work') || null;
  }

  // Set home location
  setHome(address: string, lat: number, lng: number): void {
    const locations = this.getAll().filter(l => l.type !== 'home');
    locations.push({
      id: 'home',
      type: 'home',
      name: 'Home',
      address,
      lat,
      lng,
      timestamp: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  }

  // Set work location
  setWork(address: string, lat: number, lng: number): void {
    const locations = this.getAll().filter(l => l.type !== 'work');
    locations.push({
      id: 'work',
      type: 'work',
      name: 'Work',
      address,
      lat,
      lng,
      timestamp: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  }

  // Clear all
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Delete a specific location
  delete(id: string): void {
    const locations = this.getAll().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  }
}

export const locationHistoryService = new LocationHistoryService();
export type { SavedLocation };
