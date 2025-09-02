const User = require("../models/user");
const Role = require("../models/role");
const Session = require("../models/session");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const { generateJWT } = require("../utils/generateJWT");
const { generateRefreshToken } = require("../utils/generateRefreshToken");
const { verifyRefreshToken } = require("../utils/verifyRefreshToken");

const registerUser = async (req, res) => {
  const {
    username,
    email,
    password,
    first_name,
    last_name,
    mobile_no,
    roleid,
    deviceInfo,
  } = req.body;

  if (
    !username ||
    !email ||
    !password ||
    !first_name ||
    !roleid ||
    !deviceInfo
  ) {
    return res.status(400).json({
      message: "Please provide all required fields, including deviceInfo.",
    });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already exists." });
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
    });

    const accessToken = generateJWT(newUser);
    const refreshToken = generateRefreshToken(newUser._id);

    await new Session({
      userId: newUser._id,
      refreshToken,
      deviceInfo,
    }).save();

    res.status(201).json({
      message: "User registered successfully.",
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        roleid: newUser.roleid,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error during registration.",
      error: error.message,
    });
  }
};

const registerUserWeb = async (req, res) => {
  const {
    username,
    email,
    password,
    first_name,
    last_name,
    mobile_no,
    roleid,
    deviceInfo,
  } = req.body;

  if (
    !username ||
    !email ||
    !password ||
    !first_name ||
    !roleid ||
    !deviceInfo
  ) {
    return res.status(400).json({
      message: "Please provide all required fields, including deviceInfo.",
    });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already exists." });
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
    });

    const accessToken = generateJWT(newUser);
    const refreshToken = generateRefreshToken(newUser._id);

    await new Session({
      userId: newUser._id,
      refreshToken,
      deviceInfo,
    }).save();

    res.status(201).json({
      message: "User registered successfully.",
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        roleid: newUser.roleid,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error during registration.",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email, password, and deviceInfo are required." });
  }

  try {
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid credentials." });
    }

    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid credentials." });
    }

    const accessToken = generateJWT(foundUser);
    const refreshToken = generateRefreshToken(foundUser._id);

    await new Session({
      userId: foundUser._id,
      refreshToken,
    }).save();

    res.json({
      message: "Login successful.",
      accessToken,
      refreshToken,
      user: {
        id: foundUser._id,
        username: foundUser.username,
        email: foundUser.email,
        roleid: foundUser.roleid,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error during login.", error: error.message });
  }
};

const loginUserWeb = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and Password are required." });
  }

  try {
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid credentials." });
    }

    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid credentials." });
    }

    const roleId = foundUser?.roleid;
    const roleInfo = await Role.findById(roleId);

    if (!roleInfo) {
      return res
        .status(404)
        .json({ message: "Unauthorized: Invalid credentials." });
    }

    if (roleInfo?.slug !== "super_admin") {
      return res.status(401).json({
        message: "Unauthorized: Only Super Admin can Sign in to Web.",
      });
    }

    const accessToken = generateJWT(foundUser);
    const refreshToken = generateRefreshToken(foundUser._id);

    await new Session({
      userId: foundUser._id,
      refreshToken,
    }).save();

    res.json({
      message: "Login successful.",
      accessToken,
      refreshToken,
      user: {
        id: foundUser._id,
        username: foundUser.username,
        email: foundUser.email,
        roleid: foundUser.roleid,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error during login.",
      error: error.message,
    });
  }
};

const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No refresh token provided." });
  }

  try {
    const session = await Session.findOne({ refreshToken });
    if (!session || session.logoutAt) {
      return res
        .status(403)
        .json({ message: "Forbidden: Invalid or expired session." });
    }

    try {
      const decoded = await verifyRefreshToken(refreshToken);
      const foundUser = await User.findById(decoded.id);
      if (!foundUser) {
        return res
          .status(401)
          .json({ message: "Unauthorized: User not found." });
      }

      const accessToken = generateJWT(foundUser);
      res.json({ accessToken });
    } catch (err) {
      // If token is expired or invalid, mark the session as logged out
      session.logoutAt = new Date();
      await session.save();
      return res.status(403).json({
        message:
          "Forbidden: Refresh token is expired or invalid. Session terminated.",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error while refreshing token.",
      error: error.message,
    });
  }
};

const refreshAccessTokenWeb = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No refresh token provided." });
  }

  try {
    const session = await Session.findOne({ refreshToken });
    if (!session || session.logoutAt) {
      return res
        .status(403)
        .json({ message: "Forbidden: Invalid or expired session." });
    }

    try {
      const decoded = await verifyRefreshToken(refreshToken);
      const foundUser = await User.findById(decoded.id);
      if (!foundUser) {
        return res
          .status(401)
          .json({ message: "Unauthorized: User not found." });
      }

      const accessToken = generateJWT(foundUser);
      res.json({ accessToken });
    } catch (err) {
      // If token is expired or invalid, mark the session as logged out
      session.logoutAt = new Date();
      await session.save();
      return res.status(403).json({
        message:
          "Forbidden: Refresh token is expired or invalid. Session terminated.",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error while refreshing token.",
      error: error.message,
    });
  }
};

const logoutUser = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required." });
  }

  try {
    const session = await Session.findOne({ refreshToken });

    if (!session) {
      return res
        .status(404)
        .json({ message: "Session not found or already logged out." });
    }

    session.logoutAt = new Date();
    await session.save();

    res.json({ message: "Logged out successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error during logout.", error: error.message });
  }
};

const logoutUserWeb = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required." });
  }

  try {
    const session = await Session.findOne({ refreshToken });

    if (!session) {
      return res
        .status(404)
        .json({ message: "Session not found or already logged out." });
    }

    session.logoutAt = new Date();
    await session.save();

    res.json({ message: "Logged out successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error during logout.", error: error.message });
  }
};

const updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Not logged in." });
  }

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Old and new passwords are required." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid old password." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Server error while updating password.",
      error: error.message,
    });
  }
};

// Generate a password reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    console.log(
      `Password reset link: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    );

    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_EMAIL,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <p>
            <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" 
               style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

// Forgot password endpoint
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token and set expiry (1 hour from now)
    const resetToken = generateResetToken();
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save the token and expiry to the user document
    await User.updateOne(
      { email: user.email },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetTokenExpiry,
        },
      }
    );

    // Send email with reset link
    await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "An error occurred while processing your request.",
    });
  }
};

// Reset password endpoint
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      message: "Token and new password are required",
    });
  }

  try {
    // Find user by reset token and check if it's not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and clear reset token
    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: "",
        },
      }
    );

    // Invalidate all user sessions (optional but recommended)
    await Session.deleteMany({ userId: user._id });

    res.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "An error occurred while resetting your password",
    });
  }
};

const updatePasswordWeb = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Not logged in." });
  }

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Old and new passwords are required." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid old password." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } }
    );

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Server error while updating password.",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  updatePassword,
  registerUserWeb,
  loginUserWeb,
  refreshAccessTokenWeb,
  logoutUserWeb,
  updatePasswordWeb,
  forgotPassword,
  resetPassword,
};
