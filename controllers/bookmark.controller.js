// controllers/bookmark.controller.js
const { Bookmark, Movie, User } = require('../models');

// @desc    Bookmark a movie
// @route   POST /api/bookmarks
// @access  Private
const createBookmark = async (req, res) => {
  try {
    const { tmdbId, note } = req.body;
    
    if (!tmdbId) {
      return res.status(400).json({ 
        message: 'tmdbId is required' 
      });
    }
    
    // Find movie in local DB
    const movie = await Movie.findOne({ tmdbId: parseInt(tmdbId) });
    
    if (!movie) {
      return res.status(404).json({ 
        message: 'Movie not found. Please view the movie details page first.' 
      });
    }
    
    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({
      user: req.user._id,
      movie: movie._id
    });
    
    if (existingBookmark) {
      return res.status(400).json({ 
        message: 'Movie already bookmarked' 
      });
    }
    
    // Create bookmark
    const bookmark = new Bookmark({
      user: req.user._id,
      movie: movie._id,
      tmdbId: parseInt(tmdbId),
      note: note || undefined
    });
    
    await bookmark.save();
    
    // Update movie bookmark count
    await Movie.findByIdAndUpdate(movie._id, { 
      $inc: { bookmarkCount: 1 } 
    });
    
    // Update user bookmark count
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { bookmarksCount: 1 } 
    });
    
    await bookmark.populate('movie', 'title posterPath tmdbId releaseDate');
    
    res.status(201).json({
      message: 'Movie bookmarked successfully',
      bookmark
    });
  } catch (error) {
    console.error('Create bookmark error:', error);
    res.status(500).json({ 
      message: 'Error bookmarking movie',
      error: error.message 
    });
  }
};

// @desc    Get all bookmarks for current user
// @route   GET /api/bookmarks
// @access  Private
const getMyBookmarks = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate('movie', 'title posterPath tmdbId releaseDate voteAverage')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    const total = await Bookmark.countDocuments({ user: req.user._id });
    
    res.json({
      bookmarks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ 
      message: 'Error fetching bookmarks',
      error: error.message 
    });
  }
};

// @desc    Remove bookmark
// @route   DELETE /api/bookmarks/:tmdbId
// @access  Private
const removeBookmark = async (req, res) => {
  try {
    const { tmdbId } = req.params;
    
    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      tmdbId: parseInt(tmdbId)
    });
    
    if (!bookmark) {
      return res.status(404).json({ 
        message: 'Bookmark not found' 
      });
    }
    
    // Update movie bookmark count
    await Movie.findByIdAndUpdate(bookmark.movie, { 
      $inc: { bookmarkCount: -1 } 
    });
    
    // Update user bookmark count
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { bookmarksCount: -1 } 
    });
    
    await Bookmark.findByIdAndDelete(bookmark._id);
    
    res.json({ 
      message: 'Bookmark removed successfully' 
    });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({ 
      message: 'Error removing bookmark',
      error: error.message 
    });
  }
};

// @desc    Check if movie is bookmarked
// @route   GET /api/bookmarks/check/:tmdbId
// @access  Private
const checkBookmarkStatus = async (req, res) => {
  try {
    const { tmdbId } = req.params;
    
    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      tmdbId: parseInt(tmdbId)
    });
    
    res.json({ 
      isBookmarked: !!bookmark,
      bookmark: bookmark || null
    });
  } catch (error) {
    console.error('Check bookmark status error:', error);
    res.status(500).json({ 
      message: 'Error checking bookmark status',
      error: error.message 
    });
  }
};

// @desc    Update bookmark note
// @route   PUT /api/bookmarks/:tmdbId
// @access  Private
const updateBookmark = async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const { note } = req.body;
    
    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      tmdbId: parseInt(tmdbId)
    });
    
    if (!bookmark) {
      return res.status(404).json({ 
        message: 'Bookmark not found' 
      });
    }
    
    bookmark.note = note;
    await bookmark.save();
    
    await bookmark.populate('movie', 'title posterPath tmdbId releaseDate');
    
    res.json({
      message: 'Bookmark updated successfully',
      bookmark
    });
  } catch (error) {
    console.error('Update bookmark error:', error);
    res.status(500).json({ 
      message: 'Error updating bookmark',
      error: error.message 
    });
  }
};

module.exports = {
  createBookmark,
  getMyBookmarks,
  removeBookmark,
  checkBookmarkStatus,
  updateBookmark
};