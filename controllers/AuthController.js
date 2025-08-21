const User = require('../models/user');
const Session = require('../models/session');
const bcrypt = require('bcryptjs');

const { generateJWT } = require('../utils/generateJWT');
const { generateRefreshToken } = require('../utils/generateRefreshToken');
const { verifyRefreshToken } = require('../utils/verifyRefreshToken');

const registerUser = async (req, res) => {
    const { username, email, password, first_name, last_name, mobile_no, roleid, deviceInfo } = req.body;

    if (!username || !email || !password || !first_name || !roleid || !deviceInfo) {
        return res.status(400).json({ message: 'Please provide all required fields, including deviceInfo.' });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username, email, password: hashedPassword, first_name, last_name, mobile_no, roleid
        });

        const accessToken = generateJWT(newUser);
        const refreshToken = generateRefreshToken(newUser._id);

        await new Session({
            userId: newUser._id,
            refreshToken,
            deviceInfo
        }).save();

        res.status(201).json({
            message: 'User registered successfully.',
            accessToken,
            refreshToken,
            user: { id: newUser._id, username: newUser.username, email: newUser.email, roleid: newUser.roleid }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email, password, and deviceInfo are required.' });
    }

    try {
        const foundUser = await User.findOne({ email });
        if (!foundUser) {
            return res.status(401).json({ message: 'Unauthorized: Invalid credentials.' });
        }

        const match = await bcrypt.compare(password, foundUser.password);
        if (!match) {
            return res.status(401).json({ message: 'Unauthorized: Invalid credentials.' });
        }

        const accessToken = generateJWT(foundUser);
        const refreshToken = generateRefreshToken(foundUser._id);

        await new Session({
            userId: foundUser._id,
            refreshToken
        }).save();

        res.json({
            message: 'Login successful.',
            accessToken,
            refreshToken,
            user: { id: foundUser._id, username: foundUser.username, email: foundUser.email, roleid: foundUser.roleid }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
};

const refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Unauthorized: No refresh token provided.' });
    }

    try {
        const session = await Session.findOne({ refreshToken });
        if (!session || session.logoutAt) {
            return res.status(403).json({ message: 'Forbidden: Invalid or expired session.' });
        }

        try {
            const decoded = await verifyRefreshToken(refreshToken);
            const foundUser = await User.findById(decoded.id);
            if (!foundUser) {
                return res.status(401).json({ message: 'Unauthorized: User not found.' });
            }

            const accessToken = generateJWT(foundUser);
            res.json({ accessToken });
        } catch (err) {
            // If token is expired or invalid, mark the session as logged out
            session.logoutAt = new Date();
            await session.save();
            return res.status(403).json({ message: 'Forbidden: Refresh token is expired or invalid. Session terminated.' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error while refreshing token.', error: error.message });
    }
};

const logoutUser = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required.' });
    }

    try {
        const session = await Session.findOne({ refreshToken });

        if (!session) {
            return res.status(404).json({ message: 'Session not found or already logged out.' });
        }

        session.logoutAt = new Date();
        await session.save();

        res.json({ message: 'Logged out successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during logout.', error: error.message });
    }
};

const updatePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Not logged in.' });
    }

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old and new passwords are required.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid old password.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'Password updated successfully.' });

    } catch (error) {
        res.status(500).json({ message: 'Server error while updating password.', error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    updatePassword
};