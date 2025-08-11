const Role = require('../models/role');
const User = require('../models/user');

// Create a new role
const createRole = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Role name is required.' });
    }

    try {
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            return res.status(409).json({ message: 'Role with this name already exists.' });
        }

        const newRole = new Role({ name });
        await newRole.save();

        res.status(201).json({ message: 'Role created successfully.', role: newRole });
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating role.', error: error.message });
    }
};

// Update a role's name or active status
const updateRole = async (req, res) => {
    const { id } = req.params;
    const { name, is_active } = req.body;

    if (!name && typeof is_active !== 'boolean') {
        return res.status(400).json({ message: 'Please provide a name or an active status to update.' });
    }

    try {
        const role = await Role.findById(id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found.' });
        }

        if (name) {
            role.name = name;
        }

        if (typeof is_active === 'boolean') {
            role.is_active = is_active;
        }

        await role.save();

        res.json({ message: 'Role updated successfully.', role });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating role.', error: error.message });
    }
};

// Delete a role if it is not associated with any users
const deleteRole = async (req, res) => {
    const { id } = req.params;

    try {
        const role = await Role.findById(id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found.' });
        }

        // Safety check: ensure no users are assigned this role
        const userCount = await User.countDocuments({ roleid: id });
        if (userCount > 0) {
            return res.status(400).json({ message: `Cannot delete role. It is currently assigned to ${userCount} user(s).` });
        }

        await Role.findByIdAndDelete(id);

        res.json({ message: 'Role deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting role.', error: error.message });
    }
};

// Get all roles with filtering
const getAllRoles = async (req, res) => {
    try {
        const { name, slug, is_active } = req.query;
        const filter = {};

        if (name) {
            filter.name = { $regex: name, $options: 'i' }; // Case-insensitive search
        }

        if (slug) {
            filter.slug = slug;
        }

        if (is_active !== undefined) {
            filter.is_active = is_active === 'true';
        }

        const roles = await Role.find(filter);
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching roles.', error: error.message });
    }
};

// Get a single role by ID or slug
const getRoleById = async (req, res) => {
    const { id } = req.params; // Can be ID or slug
    const isMongoId = require('mongoose').Types.ObjectId.isValid(id);

    try {
        let role;
        if (isMongoId) {
            role = await Role.findById(id);
        } else {
            role = await Role.findOne({ slug: id });
        }

        if (!role) {
            return res.status(404).json({ message: 'Role not found.' });
        }
        res.json(role);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching role.', error: error.message });
    }
};

module.exports = {
    createRole,
    updateRole,
    deleteRole,
    getAllRoles,
    getRoleById
};