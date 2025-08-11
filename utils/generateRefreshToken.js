const jwt = require('jsonwebtoken');

// Function to generate a refresh token
const generateRefreshToken = (userId) => {
  // Ensure REFRESH_TOKEN_SECRET is available from environment variables
  const secretKey = process.env.REFRESH_TOKEN_SECRET;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRATION || '7d'; // Default expiration if not set

  // Check if the secret is available
  if (!secretKey) {
    throw new Error('REFRESH_TOKEN_SECRET is not set in environment variables');
  }

  // Generate the refresh token
  return jwt.sign({ id: userId }, secretKey, {
    expiresIn: expiresIn,
  });
};

module.exports = { generateRefreshToken };
