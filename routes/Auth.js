const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    updatePassword,
    verifyToken
} = require('../controllers/AuthController');
const verifyTokenMiddleware = require('../utils/VerifyToken');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);
router.get('/verify-token', verifyToken);

// Protected route
router.put('/update-password', verifyTokenMiddleware, updatePassword);

module.exports = router;
