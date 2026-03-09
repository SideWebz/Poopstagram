const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authenticateToken = require('../middleware/auth');

router.post('/:postId', authenticateToken, commentController.createComment);
router.get('/:postId', commentController.getComments);

router.post('/:commentId/like', authenticateToken, commentController.likeComment);
router.delete('/:commentId', authenticateToken, commentController.deleteComment);

module.exports = router;
