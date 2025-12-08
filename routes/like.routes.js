// routes/like.routes.js
const express = require('express');
const router = express.Router();
const likeController = require('../controllers/like.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Public route
router.get('/review/:reviewId', likeController.getReviewLikes);

// Protected routes
router.post('/:reviewId', authenticateToken, likeController.likeReview);
router.delete('/:reviewId', authenticateToken, likeController.unlikeReview);
router.get('/check/:reviewId', authenticateToken, likeController.checkLikeStatus);

module.exports = router;