const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// Signup
router.post(
  '/signup',
  [
    body('name').notEmpty().trim(),
    body('phone').matches(/^\+92[0-9]{10}$/),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['rider', 'driver']),
    validate
  ],
  authController.signup
);

// Login
router.post(
  '/login',
  [
    body('phone').notEmpty(),
    body('password').notEmpty(),
    validate
  ],
  authController.login
);

// Switch role (for users with multiple roles)
router.post(
  '/switch-role',
  authMiddleware,
  [
    body('role').isIn(['rider', 'driver']),
    validate
  ],
  authController.switchRole
);

module.exports = router;
