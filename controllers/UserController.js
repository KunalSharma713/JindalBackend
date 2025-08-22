const User = require('../models/user');
const Role = require('../models/role');
const Warehouse = require('../models/warehouse');
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

        // Get the most recent warehouse
        const latestWarehouse = await Warehouse.findOne().sort({ createdAt: -1 });
        if (!latestWarehouse) {
            return res.status(404).json({ message: 'No warehouse found. Please create a warehouse first.' });
        }
        const warehouse = latestWarehouse._id;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            first_name,
            last_name,
            mobile_no,
            roleid,
            warehouse
        });

        // Avoid sending password back in the response
        newUser.password = undefined;

        res.status(201).json({ message: 'User created successfully.', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating user.', error: error.message });
    }

    // Check if warehouse exists
    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) {
      return res.status(404).json({ message: 'Warehouse not found.' });
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
      warehouse
    });

    // Avoid sending password back in the response
    newUser.password = undefined;

    res.status(201).json({ message: 'User created successfully.', user: newUser });
  } 

// Update user details (including email and password)
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, mobile_no, email, password ,username} = req.body;

    try {
        // Build update object with only provided fields
        const updateFields = {};
        if(username !== undefined) updateFields.username = username;
        if (first_name !== undefined) updateFields.first_name = first_name;
        if (last_name !== undefined) updateFields.last_name = last_name;
        if (mobile_no !== undefined) updateFields.mobile_no = mobile_no;

        // Handle email update with validation
        if (email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Please provide a valid email address.' });
            }

            // Check if email already exists for another user
            const existingUser = await User.findOne({ email, _id: { $ne: id } });
            if (existingUser) {
                return res.status(409).json({ message: 'Email already exists.' });
            }
            updateFields.email = email;
        }

        // Handle password update with hashing
        if (password !== undefined) {
            if (password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.password = hashedPassword;
        }

        updateFields.updated_at = new Date();

        console.log(updateFields);
        const user = await User.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        ).populate('roleid', 'name slug')
         .populate('warehouse', 'name location')
         .select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User updated successfully.', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating user.', error: error.message });
    }

    updateFields.updated_at = new Date();

    const user = await User.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('roleid', 'name slug')
      .populate('warehouse', 'name location')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User updated successfully.', user });
  } 

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

    res.json({ message: 'User role updated successfully.', user });
  } 

// Update a user's warehouse
const updateUserWarehouse = async (req, res) => {
    const { id } = req.params;
    const { warehouse } = req.body;

    if (!warehouse) {
        return res.status(400).json({ message: 'Warehouse ID is required.' });
    }

    try {
        // Check if the warehouse exists
        const warehouseExists = await Warehouse.findById(warehouse);
        if (!warehouseExists) {
            return res.status(404).json({ message: 'Warehouse not found.' });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { warehouse },
            { new: true, runValidators: true }
        ).populate('roleid', 'name slug')
         .populate('warehouse', 'name location')
         .select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User warehouse updated successfully.', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating user warehouse.', error: error.message });
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
      message: users.length > 0 ? 'Users retrieved successfully.' : 'No users found matching the criteria.',
      data: users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });
  } 

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
            .populate('warehouse', 'name location')
            .select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User found.', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching user.', error: error.message });
    }

    const user = await User.findOne(query)
      .populate('roleid', 'name slug')
      .populate('warehouse', 'name location')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User found.', user });
  } 

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

    res.json({ message: 'User deleted successfully.' });
  } 

module.exports = {
    createUser,
    updateUser,
    updateUserRole,
    updateUserWarehouse,
    getAllUsers,
    getUser,
    deleteUser
};
