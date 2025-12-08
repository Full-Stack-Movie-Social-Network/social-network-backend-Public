// routes/bookmark.routes.js
const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmark.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes are protected
router.post('/', authenticateToken, bookmarkController.createBookmark);
router.get('/', authenticateToken, bookmarkController.getMyBookmarks);
router.get('/check/:tmdbId', authenticateToken, bookmarkController.checkBookmarkStatus);
router.put('/:tmdbId', authenticateToken, bookmarkController.updateBookmark);
router.delete('/:tmdbId', authenticateToken, bookmarkController.removeBookmark);

module.exports = router;