// controllers/review.controller.js
const { Review, Movie, User, Like } = require('../models');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { content, rating, tmdbId, pros, cons } = req.body;
    
    // Validation
    if (!content || !rating || !tmdbId) {
      return res.status(400).json({ 
        message: 'Please provide content, rating, and tmdbId' 
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }
    
    // Find or create movie in local DB
    let movie = await Movie.findOne({ tmdbId: parseInt(tmdbId) });
    
    if (!movie) {
      return res.status(404).json({ 
        message: 'Movie not found. Please view the movie details page first.' 
      });
    }
    
    // Check if user already reviewed this movie
    const existingReview = await Review.findOne({ 
      user: req.user._id, 
      movie: movie._id 
    });
    
    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this movie. Use update instead.' 
      });
    }
    
    // Create review
    const review = new Review({
      content,
      rating,
      user: req.user._id,
      movie: movie._id,
      tmdbId: parseInt(tmdbId),
      pros: pros || undefined,
      cons: cons || undefined
    });
    
    await review.save();
    
    // Update movie statistics
    movie.localReviewCount += 1;
    const allReviews = await Review.find({ movie: movie._id });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    movie.localAverageRating = totalRating / allReviews.length;
    await movie.save();
    
    // Update user review count
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { reviewCount: 1 } 
    });
    
    // Populate user data
    await review.populate('user', 'username avatar role verifiedCritic');
    
    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ 
      message: 'Error creating review',
      error: error.message 
    });
  }
};

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
const getAllReviews = async (req, res) => {
  try {
    const { limit = 10, page = 1, tmdbId, userId } = req.query;
    
    let query = {};
    
    if (tmdbId) {
      const movie = await Movie.findOne({ tmdbId: parseInt(tmdbId) });
      if (movie) {
        query.movie = movie._id;
      }
    }
    
    if (userId) {
      query.user = userId;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find(query)
      .populate('user', 'username avatar role verifiedCritic')
      .populate('movie', 'title posterPath tmdbId')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    const total = await Review.countDocuments(query);
    
    res.json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ 
      message: 'Error fetching reviews',
      error: error.message 
    });
  }
};

// @desc    Get review by ID
// @route   GET /api/reviews/:reviewId
// @access  Public
const getReviewById = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId)
      .populate('user', 'username avatar role verifiedCritic')
      .populate('movie', 'title posterPath tmdbId releaseDate');
    
    if (!review) {
      return res.status(404).json({ 
        message: 'Review not found' 
      });
    }
    
    // Get likes count and check if current user liked
    const likesCount = await Like.countDocuments({ review: review._id });
    let isLiked = false;
    
    if (req.user) {
      const like = await Like.findOne({ 
        review: review._id, 
        user: req.user._id 
      });
      isLiked = !!like;
    }
    
    res.json({
      review,
      likesCount,
      isLiked
    });
  } catch (error) {
    console.error('Get review by ID error:', error);
    res.status(500).json({ 
      message: 'Error fetching review',
      error: error.message 
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:reviewId
// @access  Private (Owner only)
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content, rating, pros, cons } = req.body;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ 
        message: 'Review not found' 
      });
    }
    
    // Check ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'You can only update your own reviews' 
      });
    }
    
    // Update fields
    if (content !== undefined) review.content = content;
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          message: 'Rating must be between 1 and 5' 
        });
      }
      review.rating = rating;
    }
    if (pros !== undefined) review.pros = pros;
    if (cons !== undefined) review.cons = cons;
    
    review.isEdited = true;
    review.editedAt = Date.now();
    
    await review.save();
    
    // Recalculate movie average rating
    const movie = await Movie.findById(review.movie);
    const allReviews = await Review.find({ movie: movie._id });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    movie.localAverageRating = totalRating / allReviews.length;
    await movie.save();
    
    await review.populate('user', 'username avatar role verifiedCritic');
    
    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ 
      message: 'Error updating review',
      error: error.message 
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:reviewId
// @access  Private (Owner or Admin)
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ 
        message: 'Review not found' 
      });
    }
    
    // Check ownership or admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }
    
    // Update movie statistics
    const movie = await Movie.findById(review.movie);
    movie.localReviewCount = Math.max(0, movie.localReviewCount - 1);
    
    if (movie.localReviewCount === 0) {
      movie.localAverageRating = 0;
    } else {
      const allReviews = await Review.find({ 
        movie: movie._id,
        _id: { $ne: review._id } 
      });
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      movie.localAverageRating = totalRating / allReviews.length;
    }
    
    await movie.save();
    
    // Update user review count
    await User.findByIdAndUpdate(review.user, { 
      $inc: { reviewCount: -1 } 
    });
    
    // Delete all likes for this review
    await Like.deleteMany({ review: review._id });
    
    // Delete review
    await Review.findByIdAndDelete(reviewId);
    
    res.json({ 
      message: 'Review deleted successfully' 
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ 
      message: 'Error deleting review',
      error: error.message 
    });
  }
};

// @desc    Get reviews for a movie
// @route   GET /api/reviews/movie/:tmdbId
// @access  Public
const getMovieReviews = async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const { limit = 10, page = 1, sort = 'recent' } = req.query;
    
    const movie = await Movie.findOne({ tmdbId: parseInt(tmdbId) });
    
    if (!movie) {
      return res.json({ 
        reviews: [],
        pagination: { total: 0, page: 1, pages: 0 }
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let sortOption = { createdAt: -1 }; // default: recent
    if (sort === 'rating-high') sortOption = { rating: -1, createdAt: -1 };
    if (sort === 'rating-low') sortOption = { rating: 1, createdAt: -1 };
    if (sort === 'likes') sortOption = { likesCount: -1, createdAt: -1 };
    
    const reviews = await Review.find({ movie: movie._id })
      .populate('user', 'username avatar role verifiedCritic')
      .limit(parseInt(limit))
      .skip(skip)
      .sort(sortOption);
    
    const total = await Review.countDocuments({ movie: movie._id });
    
    res.json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get movie reviews error:', error);
    res.status(500).json({ 
      message: 'Error fetching movie reviews',
      error: error.message 
    });
  }
};

module.exports = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getMovieReviews
};