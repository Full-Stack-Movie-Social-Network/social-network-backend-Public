// services/tmdb.service.js
const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

// Create axios instance with base configuration
const tmdbAPI = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY
  }
});

// Search movies
const searchMovies = async (query, page = 1) => {
  try {
    const response = await tmdbAPI.get('/search/movie', {
      params: {
        query,
        page,
        include_adult: false
      }
    });
    return response.data;
  } catch (error) {
    console.error('TMDB search error:', error.response?.data || error.message);
    throw new Error('Failed to search movies from TMDB');
  }
};

// Get movie details by TMDB ID
const getMovieDetails = async (tmdbId) => {
  try {
    const response = await tmdbAPI.get(`/movie/${tmdbId}`, {
      params: {
        append_to_response: 'credits,videos,similar'
      }
    });
    return response.data;
  } catch (error) {
    console.error('TMDB get details error:', error.response?.data || error.message);
    throw new Error('Failed to get movie details from TMDB');
  }
};

// Get popular movies
const getPopularMovies = async (page = 1) => {
  try {
    const response = await tmdbAPI.get('/movie/popular', {
      params: { page }
    });
    return response.data;
  } catch (error) {
    console.error('TMDB popular movies error:', error.response?.data || error.message);
    throw new Error('Failed to get popular movies from TMDB');
  }
};

// Get top rated movies
const getTopRatedMovies = async (page = 1) => {
  try {
    const response = await tmdbAPI.get('/movie/top_rated', {
      params: { page }
    });
    return response.data;
  } catch (error) {
    console.error('TMDB top rated error:', error.response?.data || error.message);
    throw new Error('Failed to get top rated movies from TMDB');
  }
};

// Get now playing movies
const getNowPlayingMovies = async (page = 1) => {
  try {
    const response = await tmdbAPI.get('/movie/now_playing', {
      params: { page }
    });
    return response.data;
  } catch (error) {
    console.error('TMDB now playing error:', error.response?.data || error.message);
    throw new Error('Failed to get now playing movies from TMDB');
  }
};

// Get upcoming movies
const getUpcomingMovies = async (page = 1) => {
  try {
    const response = await tmdbAPI.get('/movie/upcoming', {
      params: { page }
    });
    return response.data;
  } catch (error) {
    console.error('TMDB upcoming error:', error.response?.data || error.message);
    throw new Error('Failed to get upcoming movies from TMDB');
  }
};

// Get movie genres
const getGenres = async () => {
  try {
    const response = await tmdbAPI.get('/genre/movie/list');
    return response.data.genres;
  } catch (error) {
    console.error('TMDB genres error:', error.response?.data || error.message);
    throw new Error('Failed to get genres from TMDB');
  }
};

// Discover movies by genre
const discoverByGenre = async (genreId, page = 1) => {
  try {
    const response = await tmdbAPI.get('/discover/movie', {
      params: {
        with_genres: genreId,
        page,
        sort_by: 'popularity.desc'
      }
    });
    return response.data;
  } catch (error) {
    console.error('TMDB discover error:', error.response?.data || error.message);
    throw new Error('Failed to discover movies from TMDB');
  }
};

// Helper function to get full image URL
const getImageUrl = (path, size = 'original') => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
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
  getImageUrl
};