const Driver = require('../models/Driver');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

const driverController = {
  upload, // Export for route use

  async updateLocation(req, res) {
    try {
      const { lat, lng, is_online } = req.body;
      const driver_id = req.user.id;

      const location = await Driver.updateLocation(driver_id, lat, lng, is_online);
      res.json({ message: 'Location updated', location });
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async setOnlineStatus(req, res) {
    try {
      const { is_online } = req.body;
      const driver_id = req.user.id;

      const location = await Driver.setOnlineStatus(driver_id, is_online);

      // Emit status change via Socket.IO if needed
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(`user_${driver_id}`).emit('status_updated', { is_online });
      }

      res.json({ message: 'Status updated', is_online });
    } catch (error) {
      console.error('Set online status error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async uploadDocuments(req, res) {
    try {
      const driver_id = req.user.id;
      const { vehicle_number, vehicle_type } = req.body;
      const files = req.files;

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const documents = {
        cnic_front: files.cnic_front?.[0]?.path,
        cnic_back: files.cnic_back?.[0]?.path,
        license_front: files.license_front?.[0]?.path,
        license_back: files.license_back?.[0]?.path,
        vehicle_number,
        vehicle_type
      };

      const result = await Driver.uploadDocuments(driver_id, documents);
      res.status(201).json({
        message: 'Documents uploaded successfully',
        status: result.status
      });
    } catch (error) {
      console.error('Upload documents error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getDocuments(req, res) {
    try {
      const driver_id = req.params.id || req.user.id;
      const documents = await Driver.getDocuments(driver_id);

      if (!documents) {
        return res.status(404).json({ error: 'Documents not found' });
      }

      res.json(documents);
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getWarnings(req, res) {
    try {
      const driver_id = req.user.id;
      const warnings = await Driver.getWarnings(driver_id);
      res.json(warnings);
    } catch (error) {
      console.error('Get warnings error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = driverController;
