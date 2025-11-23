/**
 * Base Map Provider Interface
 * All map providers must implement these methods
 */
class BaseMapProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
    this.enabled = false;
  }

  /**
   * Geocode: Convert address to coordinates
   * @param {string} address - Address to geocode
   * @returns {Promise<{lat: number, lng: number, display_name: string}>}
   */
  async geocode(address) {
    throw new Error('geocode() must be implemented by provider');
  }

  /**
   * Reverse Geocode: Convert coordinates to address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<{address: string, display_name: string}>}
   */
  async reverseGeocode(lat, lng) {
    throw new Error('reverseGeocode() must be implemented by provider');
  }

  /**
   * Autocomplete: Get address suggestions
   * @param {string} query - Search query
   * @param {object} options - Options (limit, location bias, etc)
   * @returns {Promise<Array<{display_name: string, lat: number, lng: number}>>}
   */
  async autocomplete(query, options = {}) {
    throw new Error('autocomplete() must be implemented by provider');
  }

  /**
   * Get Route: Calculate route between points
   * @param {Array<{lat: number, lng: number}>} waypoints - Route waypoints
   * @returns {Promise<{distance: number, duration: number, geometry: Array}>}
   */
  async getRoute(waypoints) {
    throw new Error('getRoute() must be implemented by provider');
  }

  /**
   * Calculate Distance Matrix
   * @param {Array<{lat: number, lng: number}>} origins
   * @param {Array<{lat: number, lng: number}>} destinations
   * @returns {Promise<Array<{distance: number, duration: number}>>}
   */
  async getDistanceMatrix(origins, destinations) {
    throw new Error('getDistanceMatrix() must be implemented by provider');
  }

  /**
   * Check if provider is available and configured
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return this.enabled && this.config.apiKey !== undefined;
  }

  /**
   * Get provider info
   * @returns {object}
   */
  getInfo() {
    return {
      name: this.name,
      enabled: this.enabled,
      requiresApiKey: this.config.requiresApiKey || false,
      rateLimit: this.config.rateLimit || null,
    };
  }
}

module.exports = BaseMapProvider;
