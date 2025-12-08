// models/index.js
const User = require('./user.model');
const Movie = require('./movie.model');
const Review = require('./review.model');
const Follow = require('./follow.model');
const Bookmark = require('./bookmark.model');
const Like = require('./like.model');

module.exports = {
  User,
  Movie,
  Review,
  Follow,
  Bookmark,
  Like
};