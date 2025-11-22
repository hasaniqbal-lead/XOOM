const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
  async signup(req, res) {
    try {
      const { name, phone, password, role } = req.body;

      // Validate role
      if (!['rider', 'driver', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Check if user exists
      const existingUser = await User.findByPhone(phone);
      if (existingUser) {
        return res.status(409).json({ error: 'Phone already exists' });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({ name, phone, password_hash, role });

      // Remove password from response
      delete user.password_hash;

      res.status(201).json({
        message: 'User created',
        user
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async login(req, res) {
    try {
      const { phone, password } = req.body;

      // Find user
      const user = await User.findByPhone(phone);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if blocked
      if (user.is_blocked) {
        return res.status(403).json({ error: 'Account is blocked' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        {
          id: user.id,
          phone: user.phone,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password from response
      delete user.password_hash;

      res.json({
        token,
        user
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = authController;
