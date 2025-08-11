const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    updatePassword
} = require('../controllers/AuthController');
const verifyToken = require('../utils/VerifyToken');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);

// Protected route
router.put('/update-password', verifyToken, updatePassword);

module.exports = router;
