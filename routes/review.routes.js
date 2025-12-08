// routes/review.routes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');

// Public routes
router.get('/', reviewController.getAllReviews);
router.get('/movie/:tmdbId', reviewController.getMovieReviews);
router.get('/:reviewId', optionalAuth, reviewController.getReviewById);

// Protected routes
router.post('/', authenticateToken, reviewController.createReview);
router.put('/:reviewId', authenticateToken, reviewController.updateReview);
router.delete('/:reviewId', authenticateToken, reviewController.deleteReview);

module.exports = router;