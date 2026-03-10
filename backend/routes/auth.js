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

module.exports = router;
