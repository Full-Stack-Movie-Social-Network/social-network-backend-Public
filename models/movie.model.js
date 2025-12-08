// models/movie.model.js
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  overview: {
    type: String
  },
  posterPath: {
    type: String
  },
  backdropPath: {
    type: String
  },
  releaseDate: {
    type: String
  },
  voteAverage: {
    type: Number
  },
  voteCount: {
    type: Number
  },
  genres: [{
    id: Number,
    name: String
  }],
  runtime: {
    type: Number
  },
  // Local statistics
  localReviewCount: {
    type: Number,
    default: 0
  },
  localAverageRating: {
    type: Number,
    default: 0
  },
  bookmarkCount: {
    type: Number,
    default: 0
  },
  // Cache timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
movieSchema.index({ tmdbId: 1 });
movieSchema.index({ title: 'text' });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;