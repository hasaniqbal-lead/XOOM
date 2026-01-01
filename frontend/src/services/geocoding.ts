import axios from 'axios';

// Use relative path in production, full URL in development
const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:3000'
);

export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  address?: unknown;
}

export interface AutocompleteResult {
  display_name: string;
  lat: number;
  lng: number;
  address?: string;
  type?: string;
}

export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: Array<[number, number]>; // [lng, lat] pairs
  steps?: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }>;
}

/**
 * Geocoding Service
 * Provides address search, autocomplete, and routing using multiple map providers
 */
class GeocodingService {
  private apiUrl: string;
  private token: string | null;

  constructor() {
    this.apiUrl = API_URL;
    this.token = localStorage.getItem('token');
  }

  /**
   * Get auth headers
   */
  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Geocode: Convert address to coordinates
   */
  async geocode(address: string, provider?: string): Promise<GeocodingResult> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/maps/geocode`,
        { address, provider },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Geocode error:', error);
      throw error;
    }
  }

  /**
   * Reverse Geocode: Convert coordinates to address
   */
  async reverseGeocode(lat: number, lng: number, provider?: string): Promise<{ address: unknown; display_name: string }> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/maps/reverse-geocode`,
        { lat, lng, provider },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      throw error;
    }
  }

  /**
   * Autocomplete: Get address suggestions
   */
  async autocomplete(
    query: string,
    options: {
      lat?: number;
      lng?: number;
      limit?: number;
      provider?: string;
    } = {}
  ): Promise<AutocompleteResult[]> {
    try {
      const params = new URLSearchParams({
        query,
        ...(options.lat && { lat: options.lat.toString() }),
        ...(options.lng && { lng: options.lng.toString() }),
        ...(options.limit && { limit: options.limit.toString() }),
        ...(options.provider && { provider: options.provider }),
      });

      const response = await axios.get(
        `${this.apiUrl}/maps/autocomplete?${params}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }

  /**
   * Get Route: Calculate route between waypoints
   */
  async getRoute(
    waypoints: Array<{ lat: number; lng: number }>,
    provider?: string
  ): Promise<RouteResult> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/maps/route`,
        { waypoints, provider },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Route error:', error);
      throw error;
    }
  }

  /**
   * Get Distance Matrix
   */
  async getDistanceMatrix(
    origins: Array<{ lat: number; lng: number }>,
    destinations: Array<{ lat: number; lng: number }>,
    provider?: string
  ): Promise<Array<{ origin: { lat: number; lng: number }; destination: { lat: number; lng: number }; distance: number; duration: number }>> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/maps/distance-matrix`,
        { origins, destinations, provider },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Distance matrix error:', error);
      throw error;
    }
  }
}

export const geocodingService = new GeocodingService();
