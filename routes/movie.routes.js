// routes/movie.routes.js
const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

// All routes are public (optionalAuth for personalization)
router.get('/search', movieController.searchMovies);
router.get('/popular', movieController.getPopularMovies);
router.get('/top-rated', movieController.getTopRatedMovies);
router.get('/now-playing', movieController.getNowPlayingMovies);
router.get('/upcoming', movieController.getUpcomingMovies);
router.get('/genres', movieController.getGenres);
router.get('/trending-local', movieController.getTrendingLocal);
router.get('/discover/:genreId', movieController.discoverByGenre);

// This must be last to avoid conflicts with other routes
router.get('/:tmdbId', optionalAuth, movieController.getMovieDetails);

module.exports = router;