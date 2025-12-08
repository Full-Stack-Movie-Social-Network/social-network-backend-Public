// controllers/like.controller.js
const { Like, Review } = require('../models');

// @desc    Like a review
// @route   POST /api/likes/:reviewId
// @access  Private
const likeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        message: 'Review not found' 
      });
    }
    
    // Check if already liked
    const existingLike = await Like.findOne({
      user: req.user._id,
      review: reviewId
    });
    
    if (existingLike) {
      return res.status(400).json({ 
        message: 'You have already liked this review' 
      });
    }
    
    // Create like
    const like = new Like({
      user: req.user._id,
      review: reviewId
    });
    
    await like.save();
    
    // Update review likes count
    await Review.findByIdAndUpdate(reviewId, { 
      $inc: { likesCount: 1 } 
    });
    
    res.status(201).json({
      message: 'Review liked successfully',
      like
    });
  } catch (error) {
    console.error('Like review error:', error);
    res.status(500).json({ 
      message: 'Error liking review',
      error: error.message 
    });
  }
};

// @desc    Unlike a review
// @route   DELETE /api/likes/:reviewId
// @access  Private
const unlikeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const like = await Like.findOne({
      user: req.user._id,
      review: reviewId
    });
    
    if (!like) {
      return res.status(404).json({ 
        message: 'You have not liked this review' 
      });
    }
    
    await Like.findByIdAndDelete(like._id);
    
    // Update review likes count
    await Review.findByIdAndUpdate(reviewId, { 
      $inc: { likesCount: -1 } 
    });
    
    res.json({ 
      message: 'Review unliked successfully' 
    });
  } catch (error) {
    console.error('Unlike review error:', error);
    res.status(500).json({ 
      message: 'Error unliking review',
      error: error.message 
    });
  }
};

// @desc    Check if current user liked a review
// @route   GET /api/likes/check/:reviewId
// @access  Private
const checkLikeStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const like = await Like.findOne({
      user: req.user._id,
      review: reviewId
    });
    
    res.json({ 
      isLiked: !!like 
    });
  } catch (error) {
    console.error('Check like status error:', error);
    res.status(500).json({ 
      message: 'Error checking like status',
      error: error.message 
    });
  }
};

// @desc    Get all users who liked a review
// @route   GET /api/likes/review/:reviewId
// @access  Public
const getReviewLikes = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const likes = await Like.find({ review: reviewId })
      .populate('user', 'username avatar role verifiedCritic')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    const total = await Like.countDocuments({ review: reviewId });
    
    res.json({
      likes: likes.map(l => l.user),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get review likes error:', error);
    res.status(500).json({ 
      message: 'Error fetching review likes',
      error: error.message 
    });
  }
};

module.exports = {
  likeReview,
  unlikeReview,
  checkLikeStatus,
  getReviewLikes
};