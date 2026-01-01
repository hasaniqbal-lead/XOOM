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
        // If user exists and wants to add a different role, add as secondary
        if (existingUser.role !== role && !existingUser.secondary_role) {
          // Verify password first
          const isValid = await bcrypt.compare(password, existingUser.password_hash);
          if (!isValid) {
            return res.status(401).json({ error: 'Invalid password. Enter your existing password to add this role.' });
          }
          
          // Add secondary role
          const updatedUser = await User.addSecondaryRole(existingUser.id, role);
          delete updatedUser.password_hash;
          
          return res.status(200).json({
            message: `${role} role added to your account`,
            user: updatedUser
          });
        }
        return res.status(409).json({ error: 'Phone already registered with this role' });
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

      // Get active role (default to primary role if not set)
      const activeRole = user.active_role || user.role;

      // Generate JWT with active role
      const token = jwt.sign(
        {
          id: user.id,
          phone: user.phone,
          role: activeRole
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password from response
      delete user.password_hash;

      // Add available roles to response
      const roles = [user.role];
      if (user.secondary_role) {
        roles.push(user.secondary_role);
      }

      res.json({
        token,
        user: {
          ...user,
          active_role: activeRole,
          available_roles: roles
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Switch between roles (for users with multiple roles)
  async switchRole(req, res) {
    try {
      const userId = req.user.id;
      const { role } = req.body;

      // Validate role
      if (!['rider', 'driver'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Check if user has this role
      const hasRole = await User.hasRole(userId, role);
      if (!hasRole) {
        return res.status(403).json({ error: 'You do not have this role' });
      }

      // Update active role
      const user = await User.switchActiveRole(userId, role);
      delete user.password_hash;

      // Generate new token with new role
      const token = jwt.sign(
        {
          id: user.id,
          phone: user.phone,
          role: role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Get available roles
      const roles = [user.role];
      if (user.secondary_role) {
        roles.push(user.secondary_role);
      }

      res.json({
        message: `Switched to ${role} mode`,
        token,
        user: {
          ...user,
          active_role: role,
          available_roles: roles
        }
      });
    } catch (error) {
      console.error('Switch role error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = authController;
