// controllers/user.controller.js
const { User, Review, Follow, Bookmark } = require('../models');

// @desc    Get all users
// @route   GET /api/users
// @access  Public
const getAllUsers = async (req, res) => {
  try {
    const { role, search, limit = 20, page = 1 } = req.query;
    
    let query = {};
    
    // Filter by role if provided
    if (role) {
      query.role = role;
    }
    
    // Search by username or name
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password -email -phone')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      message: 'Error fetching users',
      error: error.message 
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:userId
// @access  Public
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    // Check if viewing own profile or someone else's
    const isOwner = req.user && req.user._id.toString() === userId;
    
    if (isOwner) {
      res.json({ user: user.toPrivateProfile() });
    } else {
      res.json({ user: user.toPublicProfile() });
    }
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      message: 'Error fetching user',
      error: error.message 
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:userId
// @access  Private (Owner only)
const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      firstName, 
      lastName, 
      bio, 
      avatar, 
      phone 
    } = req.body;
    
    // Check if user is updating their own profile
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ 
        message: 'You can only update your own profile' 
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (phone !== undefined) user.phone = phone;
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: user.toPrivateProfile()
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ 
      message: 'Error updating profile',
      error: error.message 
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/:userId
// @access  Private (Owner or Admin)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is deleting their own account or is admin
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    // Delete user's reviews
    await Review.deleteMany({ user: userId });
    
    // Delete user's follows (as follower and following)
    await Follow.deleteMany({ 
      $or: [{ follower: userId }, { following: userId }] 
    });
    
    // Delete user's bookmarks
    await Bookmark.deleteMany({ user: userId });
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    res.json({ 
      message: 'User account deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      message: 'Error deleting user',
      error: error.message 
    });
  }
};

// @desc    Get user's reviews
// @route   GET /api/users/:userId/reviews
// @access  Public
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find({ user: userId })
      .populate('user', 'username avatar role verifiedCritic')
      .populate('movie', 'title posterPath tmdbId')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    const total = await Review.countDocuments({ user: userId });
    
    res.json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ 
      message: 'Error fetching user reviews',
      error: error.message 
    });
  }
};

// @desc    Get user's bookmarks
// @route   GET /api/users/:userId/bookmarks
// @access  Public (but shows only if own profile or public)
const getUserBookmarks = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const bookmarks = await Bookmark.find({ user: userId })
      .populate('movie', 'title posterPath tmdbId releaseDate voteAverage')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    const total = await Bookmark.countDocuments({ user: userId });
    
    res.json({
      bookmarks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user bookmarks error:', error);
    res.status(500).json({ 
      message: 'Error fetching user bookmarks',
      error: error.message 
    });
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:userId/followers
// @access  Public
const getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const followers = await Follow.find({ following: userId })
      .populate('follower', 'username avatar role verifiedCritic followersCount')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    const total = await Follow.countDocuments({ following: userId });
    
    res.json({
      followers: followers.map(f => f.follower),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user followers error:', error);
    res.status(500).json({ 
      message: 'Error fetching followers',
      error: error.message 
    });
  }
};

// @desc    Get user's following
// @route   GET /api/users/:userId/following
// @access  Public
const getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const following = await Follow.find({ follower: userId })
      .populate('following', 'username avatar role verifiedCritic followersCount')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    const total = await Follow.countDocuments({ follower: userId });
    
    res.json({
      following: following.map(f => f.following),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user following error:', error);
    res.status(500).json({ 
      message: 'Error fetching following',
      error: error.message 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserProfile,
  deleteUser,
  getUserReviews,
  getUserBookmarks,
  getUserFollowers,
  getUserFollowing
};