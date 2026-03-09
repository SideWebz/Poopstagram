const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticateToken = require('../middleware/auth');

router.post('/', authenticateToken, postController.createPost);
router.get('/', postController.getPosts);
router.get('/user/:userId', postController.getUserPosts);
router.get('/:postId', postController.getPostById);

router.post('/:postId/like', authenticateToken, postController.likePost);
router.post('/:postId/rate', authenticateToken, postController.ratePost);
router.delete('/:postId', authenticateToken, postController.deletePost);

module.exports = router;
