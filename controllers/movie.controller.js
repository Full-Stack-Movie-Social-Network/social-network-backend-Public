// controllers/movie.controller.js
const { Movie, Review, Bookmark } = require('../models');
const tmdbService = require('../services/tmdb.service');

// @desc    Search movies from TMDB
// @route   GET /api/movies/search
// @access  Public
const searchMovies = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        message: 'Search query is required' 
      });
    }
    
    const results = await tmdbService.searchMovies(query, page);
    
    res.json(results);
  } catch (error) {
    console.error('Search movies error:', error);
    res.status(500).json({ 
      message: 'Error searching movies',
      error: error.message 
    });
  }
};

// @desc    Get movie details from TMDB and local DB
// @route   GET /api/movies/:tmdbId
// @access  Public
const getMovieDetails = async (req, res) => {
  try {
    const { tmdbId } = req.params;
    
    // Get details from TMDB
    const tmdbDetails = await tmdbService.getMovieDetails(tmdbId);
    
    // Find or create movie in local database
    let localMovie = await Movie.findOne({ tmdbId: parseInt(tmdbId) });
    
    if (!localMovie) {
      // Create new movie record
      localMovie = new Movie({
        tmdbId: tmdbDetails.id,
        title: tmdbDetails.title,
        overview: tmdbDetails.overview,
        posterPath: tmdbDetails.poster_path,
        backdropPath: tmdbDetails.backdrop_path,
        releaseDate: tmdbDetails.release_date,
        voteAverage: tmdbDetails.vote_average,
        voteCount: tmdbDetails.vote_count,
        genres: tmdbDetails.genres,
        runtime: tmdbDetails.runtime
      });
      await localMovie.save();
    } else {
      // Update movie data from TMDB
      localMovie.title = tmdbDetails.title;
      localMovie.overview = tmdbDetails.overview;
      localMovie.posterPath = tmdbDetails.poster_path;
      localMovie.backdropPath = tmdbDetails.backdrop_path;
      localMovie.voteAverage = tmdbDetails.vote_average;
      localMovie.voteCount = tmdbDetails.vote_count;
      localMovie.genres = tmdbDetails.genres;
      localMovie.runtime = tmdbDetails.runtime;
      localMovie.lastUpdated = Date.now();
      await localMovie.save();
    }
    
    // Get local reviews for this movie
    const reviews = await Review.find({ movie: localMovie._id })
      .populate('user', 'username avatar role verifiedCritic')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Check if current user has bookmarked this movie
    let isBookmarked = false;
    if (req.user) {
      const bookmark = await Bookmark.findOne({ 
        user: req.user._id, 
        movie: localMovie._id 
      });
      isBookmarked = !!bookmark;
    }
    
    res.json({
      tmdb: tmdbDetails,
      local: localMovie,
      reviews,
      isBookmarked
    });
  } catch (error) {
    console.error('Get movie details error:', error);
    res.status(500).json({ 
      message: 'Error getting movie details',
      error: error.message 
    });
  }
};

// @desc    Get popular movies
// @route   GET /api/movies/popular
// @access  Public
const getPopularMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const results = await tmdbService.getPopularMovies(page);
    res.json(results);
  } catch (error) {
    console.error('Get popular movies error:', error);
    res.status(500).json({ 
      message: 'Error getting popular movies',
      error: error.message 
    });
  }
};

// @desc    Get top rated movies
// @route   GET /api/movies/top-rated
// @access  Public
const getTopRatedMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const results = await tmdbService.getTopRatedMovies(page);
    res.json(results);
  } catch (error) {
    console.error('Get top rated movies error:', error);
    res.status(500).json({ 
      message: 'Error getting top rated movies',
      error: error.message 
    });
  }
};

// @desc    Get now playing movies
// @route   GET /api/movies/now-playing
// @access  Public
const getNowPlayingMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const results = await tmdbService.getNowPlayingMovies(page);
    res.json(results);
  } catch (error) {
    console.error('Get now playing movies error:', error);
    res.status(500).json({ 
      message: 'Error getting now playing movies',
      error: error.message 
    });
  }
};

// @desc    Get upcoming movies
// @route   GET /api/movies/upcoming
// @access  Public
const getUpcomingMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const results = await tmdbService.getUpcomingMovies(page);
    res.json(results);
  } catch (error) {
    console.error('Get upcoming movies error:', error);
    res.status(500).json({ 
      message: 'Error getting upcoming movies',
      error: error.message 
    });
  }
};

// @desc    Get movie genres
// @route   GET /api/movies/genres
// @access  Public
const getGenres = async (req, res) => {
  try {
    const genres = await tmdbService.getGenres();
    res.json({ genres });
  } catch (error) {
    console.error('Get genres error:', error);
    res.status(500).json({ 
      message: 'Error getting genres',
      error: error.message 
    });
  }
};

// @desc    Discover movies by genre
// @route   GET /api/movies/discover/:genreId
// @access  Public
const discoverByGenre = async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1 } = req.query;
    const results = await tmdbService.discoverByGenre(genreId, page);
    res.json(results);
  } catch (error) {
    console.error('Discover by genre error:', error);
    res.status(500).json({ 
      message: 'Error discovering movies',
      error: error.message 
    });
  }
};

// @desc    Get movies with most reviews (from local DB)
// @route   GET /api/movies/trending-local
// @access  Public
const getTrendingLocal = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const movies = await Movie.find()
      .sort({ localReviewCount: -1, localAverageRating: -1 })
      .limit(parseInt(limit));
    
    res.json({ movies });
  } catch (error) {
    console.error('Get trending local error:', error);
    res.status(500).json({ 
      message: 'Error getting trending movies',
      error: error.message 
    });
  }
};

module.exports = {
  searchMovies,
  getMovieDetails,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  getGenres,
  discoverByGenre,
  getTrendingLocal
};