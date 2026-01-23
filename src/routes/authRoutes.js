const express = require('express');
const router = express.Router();
const { loginUser, createUser } = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Public Route
router.post('/login', loginUser);

// Protected Route (Only Super Admin can create new users)
router.post('/create-user', protect, admin, createUser);

module.exports = router;