const User = require('../models/user');
const Role = require('../models/role');
const Warehouse = require('../models/warehouse');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Create a new user (Admin action)
const createUser = async (req, res) => {
    const { username, email, password, first_name, last_name, mobile_no, roleid, warehouseId } = req.body;

    if (!username || !email || !password || !first_name || !roleid) {
        return res.status(400).json({ message: 'Please provide all required fields: username, email, password, first_name, roleid.' });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }

        const roleExists = await Role.findById(roleid);
        if (!roleExists) {
            return res.status(404).json({ message: 'Role not found.' });
        }

        let warehouseExists = null;
        if (warehouseId) {
            warehouseExists = await Warehouse.findById(warehouseId);
            if (!warehouseExists) {
                return res.status(404).json({ message: 'Warehouse not found.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            first_name,
            last_name,
            mobile_no,
            roleid,
            warehouseId
        });

        newUser.password = undefined;

        res.status(201).json({ message: 'User created successfully.', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating user.', error: error.message });
    }
};

// Update user details
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, mobile_no, warehouseId } = req.body;

    if (req.body.email || req.body.password) {
        return res.status(400).json({ message: 'Email and password cannot be updated from this endpoint.' });
    }

    try {
        if (warehouseId) {
            const warehouseExists = await Warehouse.findById(warehouseId);
            if (!warehouseExists) {
                return res.status(404).json({ message: 'Warehouse not found.' });
            }
        }

        const user = await User.findByIdAndUpdate(
            id,
            { first_name, last_name, mobile_no, warehouseId },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User updated successfully.', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating user.', error: error.message });
    }
};

// Update a user's role
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { roleid } = req.body;

    if (!roleid) {
        return res.status(400).json({ message: 'Role ID is required.' });
    }

    try {
        const roleExists = await Role.findById(roleid);
        if (!roleExists) {
            return res.status(404).json({ message: 'Role not found.' });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { roleid },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User role updated successfully.', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating user role.', error: error.message });
    }
};

// List users with filtering, pagination, and sorting
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.roleid) filter.roleid = req.query.roleid;
        if (req.query.username) filter.username = { $regex: req.query.username, $options: 'i' };
        if (req.query.email) filter.email = { $regex: req.query.email, $options: 'i' };
        if (req.query.warehouseId) filter.warehouseId = req.query.warehouseId;

        const sort = {};
        if (req.query.sortBy) {
            sort[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
        } else {
            sort.created_at = -1;
        }

        const users = await User.find(filter)
            .populate('roleid', 'name slug')
            .populate('warehouseId', 'name location')
            .select('-password')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments(filter);

        res.json({
            message: 'Users retrieved successfully.',
            data: users,
            pagination: {
                total: totalUsers,
                page,
                limit,
                totalPages: Math.ceil(totalUsers / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching users.', error: error.message });
    }
};

// Get a single user by ID, username, or email
const getUser = async (req, res) => {
    const { identifier } = req.params;

    try {
        let query;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            query = { _id: identifier };
        } else {
            query = { $or: [{ username: identifier }, { email: identifier }] };
        }

        const user = await User.findOne(query)
            .populate('roleid', 'name slug')
            .populate('warehouseId', 'name location')
            .select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User found.', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching user.', error: error.message });
    }
};

// Delete a user
const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting user.', error: error.message });
    }
};

module.exports = {
    createUser,
    updateUser,
    updateUserRole,
    getAllUsers,
    getUser,
    deleteUser
};
