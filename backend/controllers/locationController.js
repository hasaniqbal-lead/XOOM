const SavedLocation = require('../models/SavedLocation');

const locationController = {
  // Get all saved locations for the authenticated user
  async getLocations(req, res) {
    try {
      const userId = req.user.id;
      const locations = await SavedLocation.findByUserId(userId);
      res.json({ success: true, locations });
    } catch (error) {
      console.error('Get locations error:', error);
      res.status(500).json({ error: 'Failed to fetch saved locations' });
    }
  },

  // Create a new saved location
  async createLocation(req, res) {
    try {
      const userId = req.user.id;
      const { label, address, lat, lng, icon } = req.body;

      const location = await SavedLocation.create({
        user_id: userId,
        label,
        address,
        lat,
        lng,
        icon: icon || 'pin'
      });

      res.status(201).json({ success: true, location });
    } catch (error) {
      console.error('Create location error:', error);
      
      // Check for duplicate label error
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'A location with this label already exists' });
      }
      
      res.status(500).json({ error: 'Failed to save location' });
    }
  },

  // Update a saved location
  async updateLocation(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { label, address, lat, lng, icon } = req.body;

      const location = await SavedLocation.update(id, userId, {
        label,
        address,
        lat,
        lng,
        icon
      });

      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json({ success: true, location });
    } catch (error) {
      console.error('Update location error:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({ error: 'A location with this label already exists' });
      }
      
      res.status(500).json({ error: 'Failed to update location' });
    }
  },

  // Delete a saved location
  async deleteLocation(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const location = await SavedLocation.delete(id, userId);

      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json({ success: true, message: 'Location deleted' });
    } catch (error) {
      console.error('Delete location error:', error);
      res.status(500).json({ error: 'Failed to delete location' });
    }
  },

  // Set a location as default pickup
  async setDefaultPickup(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const location = await SavedLocation.setDefaultPickup(id, userId);

      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json({ success: true, location });
    } catch (error) {
      console.error('Set default pickup error:', error);
      res.status(500).json({ error: 'Failed to set default pickup' });
    }
  },

  // Set a location as default drop
  async setDefaultDrop(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const location = await SavedLocation.setDefaultDrop(id, userId);

      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json({ success: true, location });
    } catch (error) {
      console.error('Set default drop error:', error);
      res.status(500).json({ error: 'Failed to set default drop' });
    }
  },

  // Get default locations
  async getDefaults(req, res) {
    try {
      const userId = req.user.id;
      const defaults = await SavedLocation.getDefaults(userId);
      res.json({ success: true, defaults });
    } catch (error) {
      console.error('Get defaults error:', error);
      res.status(500).json({ error: 'Failed to fetch default locations' });
    }
  }
};

module.exports = locationController;

