// controllers/follow.controller.js
const { Follow, User } = require('../models');

// @desc    Follow a user
// @route   POST /api/follows/:userId
// @access  Private
const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if trying to follow self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ 
        message: 'You cannot follow yourself' 
      });
    }
    
    // Check if user exists
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: req.user._id,
      following: userId
    });
    
    if (existingFollow) {
      return res.status(400).json({ 
        message: 'You are already following this user' 
      });
    }
    
    // Create follow relationship
    const follow = new Follow({
      follower: req.user._id,
      following: userId
    });
    
    await follow.save();
    
    // Update follower and following counts
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { followingCount: 1 } 
    });
    await User.findByIdAndUpdate(userId, { 
      $inc: { followersCount: 1 } 
    });
    
    res.status(201).json({
      message: 'Successfully followed user',
      follow
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ 
      message: 'Error following user',
      error: error.message 
    });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/follows/:userId
// @access  Private
const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const follow = await Follow.findOne({
      follower: req.user._id,
      following: userId
    });
    
    if (!follow) {
      return res.status(404).json({ 
        message: 'You are not following this user' 
      });
    }
    
    await Follow.findByIdAndDelete(follow._id);
    
    // Update follower and following counts
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { followingCount: -1 } 
    });
    await User.findByIdAndUpdate(userId, { 
      $inc: { followersCount: -1 } 
    });
    
    res.json({ 
      message: 'Successfully unfollowed user' 
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ 
      message: 'Error unfollowing user',
      error: error.message 
    });
  }
};

// @desc    Check if current user follows another user
// @route   GET /api/follows/check/:userId
// @access  Private
const checkFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const follow = await Follow.findOne({
      follower: req.user._id,
      following: userId
    });
    
    res.json({ 
      isFollowing: !!follow 
    });
  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json({ 
      message: 'Error checking follow status',
      error: error.message 
    });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  checkFollowStatus
};