const User = require('../models/user');
const Role = require('../models/role');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
 
// Create a new user (Admin action)
const createUser = async (req, res) => {
    const { username, email, password, first_name, last_name, mobile_no, roleid } = req.body;
 
    if (!username || !email || !password || !first_name || !roleid) {
        return res.status(400).json({ message: 'Please provide all required fields: username, email, password, first_name, roleid.' });
    }
 
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }
 
        // Check if role exists
        const roleExists = await Role.findById(roleid);
        if (!roleExists) {
            return res.status(404).json({ message: 'Role not found.' });
        }
 
        const hashedPassword = await bcrypt.hash(password, 10);
 
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            first_name,
            last_name,
            mobile_no,
            roleid
        });
 
        // Avoid sending password back in the response
        newUser.password = undefined;
 
        res.status(201).json({ message: 'User created successfully.', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating user.', error: error.message });
    }
};
 
// Update user details
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, mobile_no, email, password } = req.body;
    const updateFields = { first_name, last_name, mobile_no };
 
    try {
        // If email is being updated, check if it's already in use by another user
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: id } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already in use.' });
            }
            updateFields.email = email;
        }

        // If password is being updated, hash the new password
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateFields.password = await bcrypt.hash(password, salt);
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        ).select('-password'); // Exclude password from the result
 
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
        // Check if the role exists
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
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
 
        // Filtering
        const filter = {};
        if (req.query.roleid) {
            filter.roleid = req.query.roleid;
        }
        if (req.query.username) {
            filter.username = { $regex: req.query.username, $options: 'i' };
        }
         if (req.query.email) {
            filter.email = { $regex: req.query.email, $options: 'i' };
        }
 
        // Sorting
        const sort = {};
        if (req.query.sortBy) {
            sort[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
        } else {
            sort.created_at = -1; // Default sort
        }
 
        const users = await User.find(filter)
            .populate('roleid', 'name slug') // Populate role details
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
            .select('-password');
 
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
 
        res.json({ message: 'User found.', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching user.', error: error.message });
    }
};
 
// Delete a user by ID
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