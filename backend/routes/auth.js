const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile', authenticateToken, authController.getProfile);
router.get('/profile/:userId', authenticateToken, authController.getUserProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.get('/search', authenticateToken, authController.searchUsers);
router.post('/follow/:userId', authenticateToken, authController.followUser);
router.post('/unfollow/:userId', authenticateToken, authController.unfollowUser);
router.get('/followers/:userId', authenticateToken, authController.getFollowers);
router.get('/following/:userId', authenticateToken, authController.getFollowing);

module.exports = router;
