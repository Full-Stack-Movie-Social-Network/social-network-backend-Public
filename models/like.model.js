// models/like.model.js
const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate likes
likeSchema.index({ user: 1, review: 1 }, { unique: true });
likeSchema.index({ review: 1, createdAt: -1 });

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;