const express = require('express');
const router = express.Router();
const {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole
} = require('../controllers/RoleController');
const verifyToken = require('../utils/VerifyToken');

// Protect all role routes
router.use(verifyToken);

// POST /api/role - Create a new role
router.post('/', createRole);

// GET /api/role - Get all roles with optional filtering
router.get('/', getAllRoles);

// GET /api/role/:id - Get a single role by ID or slug
router.get('/:id', getRoleById);

// PUT /api/role/:id - Update a role
router.put('/:id', updateRole);

// DELETE /api/role/:id - Delete a role
router.delete('/:id', deleteRole);

module.exports = router;