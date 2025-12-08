// routes/follow.routes.js
const express = require('express');
const router = express.Router();
const followController = require('../controllers/follow.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes are protected
router.post('/:userId', authenticateToken, followController.followUser);
router.delete('/:userId', authenticateToken, followController.unfollowUser);
router.get('/check/:userId', authenticateToken, followController.checkFollowStatus);

module.exports = router;