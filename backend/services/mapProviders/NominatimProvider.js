const BaseMapProvider = require('./BaseMapProvider');
const axios = require('axios');

/**
 * Nominatim + OSRM Provider (100% Free)
 * - Nominatim: OpenStreetMap geocoding service
 * - OSRM: Open Source Routing Machine
 *
 * Rate Limits:
 * - Nominatim: 1 request/second (fair use policy)
 * - OSRM: No strict limits on public server
 */
class NominatimProvider extends BaseMapProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'nominatim';
    this.enabled = true;
    this.nominatimUrl = config.nominatimUrl || 'https://nominatim.openstreetmap.org';
    this.osrmUrl = config.osrmUrl || 'https://router.project-osrm.org';
    this.userAgent = config.userAgent || 'XOOM-RideHailing/1.0';

    // Rate limiting
    this.lastRequest = 0;
    this.minInterval = 1000; // 1 second between requests
  }

  /**
   * Respect rate limiting
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }

    this.lastRequest = Date.now();
  }

  /**
   * Geocode: Convert address to coordinates
   */
  async geocode(address) {
    try {
      await this.rateLimit();

      const response = await axios.get(`${this.nominatimUrl}/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          display_name: result.display_name,
          address: result.address,
        };
      }

      throw new Error('Address not found');
    } catch (error) {
      console.error('Nominatim geocode error:', error.message);
      throw error;
    }
  }

  /**
   * Reverse Geocode: Convert coordinates to address
   */
  async reverseGeocode(lat, lng) {
    try {
      await this.rateLimit();

      const response = await axios.get(`${this.nominatimUrl}/reverse`, {
        params: {
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (response.data) {
        return {
          address: response.data.address,
          display_name: response.data.display_name,
        };
      }

      throw new Error('Location not found');
    } catch (error) {
      console.error('Nominatim reverse geocode error:', error.message);
      throw error;
    }
  }

  /**
   * Autocomplete: Get address suggestions
   */
  async autocomplete(query, options = {}) {
    try {
      await this.rateLimit();

      const params = {
        q: query,
        format: 'json',
        limit: options.limit || 5,
        addressdetails: 1,
      };

      // Add location bias if provided
      if (options.lat && options.lng) {
        params.viewbox = `${options.lng - 0.1},${options.lat - 0.1},${options.lng + 0.1},${options.lat + 0.1}`;
        params.bounded = 1;
      }

      const response = await axios.get(`${this.nominatimUrl}/search`, {
        params,
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (response.data) {
        return response.data.map(item => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          address: item.address,
          type: item.type,
        }));
      }

      return [];
    } catch (error) {
      console.error('Nominatim autocomplete error:', error.message);
      return [];
    }
  }

  /**
   * Get Route: Calculate route using OSRM
   */
  async getRoute(waypoints) {
    try {
      // OSRM doesn't need rate limiting like Nominatim
      const coordinates = waypoints
        .map(wp => `${wp.lng},${wp.lat}`)
        .join(';');

      const response = await axios.get(
        `${this.osrmUrl}/route/v1/driving/${coordinates}`,
        {
          params: {
            overview: 'full',
            geometries: 'geojson',
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
      console.error('OSRM route error:', error.message);
      throw error;
    }
  }

  /**
   * Calculate Distance Matrix using OSRM
   */
  async getDistanceMatrix(origins, destinations) {
    try {
      // For simplicity, calculate routes one by one
      // OSRM has a table service but it's more complex
      const results = [];

      for (const origin of origins) {
        for (const destination of destinations) {
          try {
            const route = await this.getRoute([origin, destination]);
            results.push({
              origin,
              destination,
              distance: route.distance,
              duration: route.duration,
            });
          } catch (error) {
            results.push({
              origin,
              destination,
              distance: null,
              duration: null,
              error: error.message,
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error('OSRM distance matrix error:', error.message);
      throw error;
    }
  }

  /**
   * Check if provider is available
   */
  async isAvailable() {
    try {
      // Test Nominatim
      const response = await axios.get(`${this.nominatimUrl}/status`, {
        timeout: 3000,
        headers: {
          'User-Agent': this.userAgent,
        },
      });
      return response.status === 200;
    } catch (error) {
      console.error('Nominatim availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Get provider info
   */
  getInfo() {
    return {
      name: this.name,
      displayName: 'OpenStreetMap (Nominatim + OSRM)',
      enabled: this.enabled,
      requiresApiKey: false,
      cost: 'Free',
      rateLimit: '1 request/second',
      features: [
        'Geocoding',
        'Reverse Geocoding',
        'Autocomplete',
        'Routing',
        'Distance Matrix',
      ],
    };
  }
}

module.exports = NominatimProvider;
