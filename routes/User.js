const express = require('express');
const router = express.Router();
const {
    createUser,
    getAllUsers,
    getUser,
    updateUser,
    updateUserRole,
    deleteUser
} = require('../controllers/UserController');
const verifyToken = require('../utils/VerifyToken');

// Protect all user routes
router.use(verifyToken);

// POST /api/users - Create a new user
router.post('/', createUser);

// GET /api/users - Get all users with filtering, sorting, and pagination
router.get('/', getAllUsers);

// GET /api/users/:identifier - Get a single user by ID, username, or email
router.get('/:identifier', getUser);

// PUT /api/users/:id - Update user's profile information
router.put('/:id', updateUser);

// PATCH /api/users/:id/role - Update a user's role
router.patch('/:id/role', updateUserRole);

// DELETE /api/users/:id - Delete a user
router.delete('/:id', deleteUser);

module.exports = router;