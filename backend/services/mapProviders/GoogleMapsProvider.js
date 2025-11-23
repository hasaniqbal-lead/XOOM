const BaseMapProvider = require('./BaseMapProvider');
const axios = require('axios');

/**
 * Google Maps Provider
 * Requires API key and billing enabled
 * $200 free credit per month
 *
 * Features:
 * - Most accurate geocoding
 * - Best autocomplete
 * - Most reliable routing
 * - Global coverage
 */
class GoogleMapsProvider extends BaseMapProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'google';
    this.enabled = !!config.apiKey;
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  /**
   * Geocode: Convert address to coordinates
   */
  async geocode(address) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          display_name: result.formatted_address,
          address: result.formatted_address,
        };
      }

      throw new Error('Address not found');
    } catch (error) {
      console.error('Google Maps geocode error:', error.message);
      throw error;
    }
  }

  /**
   * Reverse Geocode: Convert coordinates to address
   */
  async reverseGeocode(lat, lng) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey,
        },
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          address: result.formatted_address,
          display_name: result.formatted_address,
        };
      }

      throw new Error('Location not found');
    } catch (error) {
      console.error('Google Maps reverse geocode error:', error.message);
      throw error;
    }
  }

  /**
   * Autocomplete: Get address suggestions using Places API
   */
  async autocomplete(query, options = {}) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const params = {
        input: query,
        key: this.apiKey,
      };

      // Add location bias if provided
      if (options.lat && options.lng) {
        params.location = `${options.lat},${options.lng}`;
        params.radius = options.radius || 50000; // 50km
      }

      const response = await axios.get(`${this.baseUrl}/place/autocomplete/json`, {
        params,
      });

      if (response.data && response.data.predictions) {
        // Get details for each prediction
        const results = await Promise.all(
          response.data.predictions.slice(0, options.limit || 5).map(async prediction => {
            try {
              const detailResponse = await axios.get(`${this.baseUrl}/place/details/json`, {
                params: {
                  place_id: prediction.place_id,
                  fields: 'geometry,formatted_address',
                  key: this.apiKey,
                },
              });

              if (detailResponse.data && detailResponse.data.result) {
                const detail = detailResponse.data.result;
                return {
                  display_name: prediction.description,
                  lat: detail.geometry.location.lat,
                  lng: detail.geometry.location.lng,
                  address: detail.formatted_address,
                  type: prediction.types[0],
                };
              }
            } catch (error) {
              console.error('Google Maps place details error:', error.message);
            }

            return null;
          })
        );

        return results.filter(r => r !== null);
      }

      return [];
    } catch (error) {
      console.error('Google Maps autocomplete error:', error.message);
      return [];
    }
  }

  /**
   * Get Route: Calculate route using Directions API
   */
  async getRoute(waypoints) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const origin = `${waypoints[0].lat},${waypoints[0].lng}`;
      const destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`;

      const params = {
        origin,
        destination,
        key: this.apiKey,
      };

      // Add intermediate waypoints if any
      if (waypoints.length > 2) {
        params.waypoints = waypoints
          .slice(1, -1)
          .map(wp => `${wp.lat},${wp.lng}`)
          .join('|');
      }

      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params,
      });

      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];

        // Decode polyline to get geometry
        const geometry = this.decodePolyline(route.overview_polyline.points);

        return {
          distance: leg.distance.value, // meters
          duration: leg.duration.value, // seconds
          geometry: geometry, // [[lng, lat], ...]
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance.value,
            duration: step.duration.value,
          })),
        };
      }

      throw new Error('No route found');
    } catch (error) {
      console.error('Google Maps route error:', error.message);
      throw error;
    }
  }

  /**
   * Decode Google Maps polyline
   */
  decodePolyline(encoded) {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push([lng / 1e5, lat / 1e5]); // [lng, lat] format
    }

    return points;
  }

  /**
   * Calculate Distance Matrix
   */
  async getDistanceMatrix(origins, destinations) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
      const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');

      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params: {
          origins: originsStr,
          destinations: destinationsStr,
          key: this.apiKey,
        },
      });

      if (response.data && response.data.rows) {
        const results = [];

        response.data.rows.forEach((row, originIndex) => {
          row.elements.forEach((element, destIndex) => {
            results.push({
              origin: origins[originIndex],
              destination: destinations[destIndex],
              distance: element.distance ? element.distance.value : null,
              duration: element.duration ? element.duration.value : null,
            });
          });
        });

        return results;
      }

      throw new Error('Distance matrix calculation failed');
    } catch (error) {
      console.error('Google Maps distance matrix error:', error.message);
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
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: 'test',
          key: this.apiKey,
        },
        timeout: 3000,
      });
      return response.status === 200 && response.data.status !== 'REQUEST_DENIED';
    } catch (error) {
      console.error('Google Maps availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Get provider info
   */
  getInfo() {
    return {
      name: this.name,
      displayName: 'Google Maps',
      enabled: this.enabled,
      requiresApiKey: true,
      cost: '$200 free credit/month, then pay-as-you-go',
      rateLimit: 'Based on billing plan',
      features: [
        'Geocoding',
        'Reverse Geocoding',
        'Autocomplete (Places API)',
        'Routing',
        'Distance Matrix',
        'Most accurate data',
        'Global coverage',
      ],
    };
  }
}

module.exports = GoogleMapsProvider;
