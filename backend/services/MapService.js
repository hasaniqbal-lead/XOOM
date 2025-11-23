const NominatimProvider = require('./mapProviders/NominatimProvider');
const MapboxProvider = require('./mapProviders/MapboxProvider');
const GoogleMapsProvider = require('./mapProviders/GoogleMapsProvider');

/**
 * Map Service with Multiple Providers and Fallback Logic
 *
 * Supports:
 * 1. Nominatim + OSRM (Free, default)
 * 2. Mapbox (Free tier 50k/month)
 * 3. Google Maps (Paid, $200 credit/month)
 *
 * Features:
 * - Automatic fallback if primary provider fails
 * - Admin-configurable provider selection
 * - Provider health monitoring
 */
class MapService {
  constructor() {
    this.providers = {};
    this.primaryProvider = 'nominatim';
    this.fallbackOrder = ['nominatim', 'mapbox', 'google'];

    this.initializeProviders();
  }

  /**
   * Initialize all map providers
   */
  initializeProviders() {
    // Nominatim + OSRM (Always available, no API key needed)
    this.providers.nominatim = new NominatimProvider({
      userAgent: process.env.MAP_USER_AGENT || 'XOOM-RideHailing/1.0',
    });

    // Mapbox (Requires API key)
    this.providers.mapbox = new MapboxProvider({
      apiKey: process.env.MAPBOX_API_KEY,
    });

    // Google Maps (Requires API key)
    this.providers.google = new GoogleMapsProvider({
      apiKey: process.env.GOOGLE_MAPS_API_KEY,
    });

    // Set primary provider from environment
    const envProvider = process.env.MAP_PROVIDER || 'nominatim';
    if (this.providers[envProvider]) {
      this.primaryProvider = envProvider;
    }

    console.log(`🗺️  Map Service initialized with primary provider: ${this.primaryProvider}`);
    this.logProviderStatus();
  }

  /**
   * Log provider status
   */
  logProviderStatus() {
    Object.entries(this.providers).forEach(([name, provider]) => {
      const info = provider.getInfo();
      console.log(`   - ${info.displayName}: ${info.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    });
  }

  /**
   * Get active provider or fallback
   */
  async getProvider(preferredProvider = null) {
    const providerName = preferredProvider || this.primaryProvider;

    // Try preferred provider first
    if (this.providers[providerName] && this.providers[providerName].enabled) {
      try {
        const isAvailable = await this.providers[providerName].isAvailable();
        if (isAvailable) {
          return this.providers[providerName];
        }
      } catch (error) {
        console.warn(`Provider ${providerName} availability check failed:`, error.message);
      }
    }

    // Fallback to other providers
    for (const fallbackName of this.fallbackOrder) {
      if (fallbackName === providerName) continue; // Already tried

      if (this.providers[fallbackName] && this.providers[fallbackName].enabled) {
        try {
          const isAvailable = await this.providers[fallbackName].isAvailable();
          if (isAvailable) {
            console.log(`Falling back to provider: ${fallbackName}`);
            return this.providers[fallbackName];
          }
        } catch (error) {
          console.warn(`Fallback provider ${fallbackName} failed:`, error.message);
        }
      }
    }

    throw new Error('No map provider available');
  }

  /**
   * Geocode with fallback
   */
  async geocode(address, preferredProvider = null) {
    const provider = await this.getProvider(preferredProvider);
    return await provider.geocode(address);
  }

  /**
   * Reverse geocode with fallback
   */
  async reverseGeocode(lat, lng, preferredProvider = null) {
    const provider = await this.getProvider(preferredProvider);
    return await provider.reverseGeocode(lat, lng);
  }

  /**
   * Autocomplete with fallback
   */
  async autocomplete(query, options = {}, preferredProvider = null) {
    const provider = await this.getProvider(preferredProvider);
    return await provider.autocomplete(query, options);
  }

  /**
   * Get route with fallback
   */
  async getRoute(waypoints, preferredProvider = null) {
    const provider = await this.getProvider(preferredProvider);
    return await provider.getRoute(waypoints);
  }

  /**
   * Get distance matrix with fallback
   */
  async getDistanceMatrix(origins, destinations, preferredProvider = null) {
    const provider = await this.getProvider(preferredProvider);
    return await provider.getDistanceMatrix(origins, destinations);
  }

  /**
   * Set primary provider (for admin control)
   */
  setPrimaryProvider(providerName) {
    if (this.providers[providerName]) {
      this.primaryProvider = providerName;
      console.log(`Primary map provider changed to: ${providerName}`);
      return true;
    }
    return false;
  }

  /**
   * Get all provider info (for admin dashboard)
   */
  getProvidersInfo() {
    return Object.entries(this.providers).map(([name, provider]) => ({
      name,
      ...provider.getInfo(),
      isPrimary: name === this.primaryProvider,
    }));
  }

  /**
   * Check health of all providers
   */
  async checkProvidersHealth() {
    const health = {};

    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        const isAvailable = await provider.isAvailable();
        health[name] = {
          available: isAvailable,
          enabled: provider.enabled,
          info: provider.getInfo(),
        };
      } catch (error) {
        health[name] = {
          available: false,
          enabled: provider.enabled,
          error: error.message,
        };
      }
    }

    return health;
  }

  /**
   * Update provider configuration (for admin)
   */
  updateProviderConfig(providerName, config) {
    if (this.providers[providerName]) {
      // Re-initialize provider with new config
      switch (providerName) {
        case 'nominatim':
          this.providers.nominatim = new NominatimProvider(config);
          break;
        case 'mapbox':
          this.providers.mapbox = new MapboxProvider(config);
          break;
        case 'google':
          this.providers.google = new GoogleMapsProvider(config);
          break;
      }
      return true;
    }
    return false;
  }
}

// Export singleton instance
module.exports = new MapService();
