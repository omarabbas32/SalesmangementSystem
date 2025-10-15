// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Import the functions that contain the logic
const { 
    registerUser, 
    loginUser, 
    deleteUser 
} = require('../controllers/userController');

// Import the middleware for authorization
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected route - only for Admins
// It first checks if the user is logged in (protect)
// Then it checks if the user has the 'Admin' role (authorize)
router.delete('/:id', protect, authorize('Admin'), deleteUser);

module.exports = router;