// routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken, optionalAuth, isOwner, authorizeRole } = require('../middleware/auth.middleware');

// Public routes (with optional auth for personalization)
router.get('/', optionalAuth, userController.getAllUsers);
router.get('/:userId', optionalAuth, userController.getUserById);
router.get('/:userId/reviews', userController.getUserReviews);
router.get('/:userId/bookmarks', userController.getUserBookmarks);
router.get('/:userId/followers', userController.getUserFollowers);
router.get('/:userId/following', userController.getUserFollowing);

// Protected routes
router.put('/:userId', authenticateToken, userController.updateUserProfile);
router.delete('/:userId', authenticateToken, userController.deleteUser);

module.exports = router;