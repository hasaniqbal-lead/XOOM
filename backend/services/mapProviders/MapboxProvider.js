const BaseMapProvider = require('./BaseMapProvider');
const axios = require('axios');

/**
 * Mapbox Provider
 * Free tier: 50,000 requests/month
 * Requires API key from https://www.mapbox.com/
 *
 * Features:
 * - Professional-grade geocoding
 * - Fast autocomplete
 * - Accurate routing
 * - Beautiful map tiles
 */
class MapboxProvider extends BaseMapProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'mapbox';
    this.enabled = !!config.apiKey;
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://api.mapbox.com';
  }

  /**
   * Geocode: Convert address to coordinates
   */
  async geocode(address) {
    if (!this.apiKey) {
      throw new Error('Mapbox API key not configured');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
        {
          params: {
            access_token: this.apiKey,
            limit: 1,
          },
        }
      );

      if (response.data && response.data.features && response.data.features.length > 0) {
        const result = response.data.features[0];
        return {
          lat: result.center[1],
          lng: result.center[0],
          display_name: result.place_name,
          address: result.properties.address || result.place_name,
        };
      }

      throw new Error('Address not found');
    } catch (error) {
      console.error('Mapbox geocode error:', error.message);
      throw error;
    }
  }

  /**
   * Reverse Geocode: Convert coordinates to address
   */
  async reverseGeocode(lat, lng) {
    if (!this.apiKey) {
      throw new Error('Mapbox API key not configured');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${lng},${lat}.json`,
        {
          params: {
            access_token: this.apiKey,
          },
        }
      );

      if (response.data && response.data.features && response.data.features.length > 0) {
        const result = response.data.features[0];
        return {
          address: result.properties.address || result.place_name,
          display_name: result.place_name,
        };
      }

      throw new Error('Location not found');
    } catch (error) {
      console.error('Mapbox reverse geocode error:', error.message);
      throw error;
    }
  }

  /**
   * Autocomplete: Get address suggestions
   */
  async autocomplete(query, options = {}) {
    if (!this.apiKey) {
      throw new Error('Mapbox API key not configured');
    }

    try {
      const params = {
        access_token: this.apiKey,
        limit: options.limit || 5,
        autocomplete: true,
      };

      // Add location bias if provided
      if (options.lat && options.lng) {
        params.proximity = `${options.lng},${options.lat}`;
      }

      // Add country restriction if provided
      if (options.country) {
        params.country = options.country;
      }

      const response = await axios.get(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        { params }
      );

      if (response.data && response.data.features) {
        return response.data.features.map(item => ({
          display_name: item.place_name,
          lat: item.center[1],
          lng: item.center[0],
          address: item.properties.address || item.place_name,
          type: item.place_type[0],
        }));
      }

      return [];
    } catch (error) {
      console.error('Mapbox autocomplete error:', error.message);
      return [];
    }
  }

  /**
   * Get Route: Calculate route using Mapbox Directions
   */
  async getRoute(waypoints) {
    if (!this.apiKey) {
      throw new Error('Mapbox API key not configured');
    }

    try {
      const coordinates = waypoints
        .map(wp => `${wp.lng},${wp.lat}`)
        .join(';');

      const response = await axios.get(
        `${this.baseUrl}/directions/v5/mapbox/driving/${coordinates}`,
        {
          params: {
            access_token: this.apiKey,
            geometries: 'geojson',
            overview: 'full',
            steps: true,
          },
        }
      );

      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];

        return {
          distance: route.distance, // meters
          duration: route.duration, // seconds
          geometry: route.geometry.coordinates, // [lng, lat] pairs
          steps: route.legs[0].steps.map(step => ({
            instruction: step.maneuver.instruction || '',
            distance: step.distance,
            duration: step.duration,
          })),
        };
      }

      throw new Error('No route found');
    } catch (error) {
      console.error('Mapbox route error:', error.message);
      throw error;
    }
  }

  /**
   * Calculate Distance Matrix
   */
  async getDistanceMatrix(origins, destinations) {
    if (!this.apiKey) {
      throw new Error('Mapbox API key not configured');
    }

    try {
      // Mapbox Matrix API
      const coordinates = [...origins, ...destinations]
        .map(point => `${point.lng},${point.lat}`)
        .join(';');

      const sources = origins.map((_, index) => index).join(';');
      const targets = destinations
        .map((_, index) => origins.length + index)
        .join(';');

      const response = await axios.get(
        `${this.baseUrl}/directions-matrix/v1/mapbox/driving/${coordinates}`,
        {
          params: {
            access_token: this.apiKey,
            sources,
            destinations: targets,
          },
        }
      );

      if (response.data && response.data.durations) {
        const results = [];

        response.data.durations.forEach((row, originIndex) => {
          row.forEach((duration, destIndex) => {
            results.push({
              origin: origins[originIndex],
              destination: destinations[destIndex],
              distance: response.data.distances[originIndex][destIndex],
              duration: duration,
            });
          });
        });

        return results;
      }

      throw new Error('Distance matrix calculation failed');
    } catch (error) {
      console.error('Mapbox distance matrix error:', error.message);
      throw error;
    }
  }

  /**
   * Check if provider is available
   */
  async isAvailable() {
    if (!this.apiKey) {
      return false;
    }

    try {
      // Test with a simple geocode request
      const response = await axios.get(
        `${this.baseUrl}/geocoding/v5/mapbox.places/test.json`,
        {
          params: {
            access_token: this.apiKey,
            limit: 1,
          },
          timeout: 3000,
        }
      );
      return response.status === 200;
    } catch (error) {
      console.error('Mapbox availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Get provider info
   */
  getInfo() {
    return {
      name: this.name,
      displayName: 'Mapbox',
      enabled: this.enabled,
      requiresApiKey: true,
      cost: 'Free tier: 50,000 requests/month',
      rateLimit: 'No strict limit on free tier',
      features: [
        'Geocoding',
        'Reverse Geocoding',
        'Autocomplete',
        'Routing',
        'Distance Matrix',
        'Professional map tiles',
      ],
    };
  }
}

module.exports = MapboxProvider;
