const jwt = require('jsonwebtoken');

// Function to generate JWT (access token)
const generateJWT = (user) => {
  // Ensure ACCESS_TOKEN_SECRET is available from environment variables
  const secretKey = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRATION || '15m'; // Default expiration if not set

  // Check if the secret is available
  if (!secretKey) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }

  const payload = {
      UserInfo: {
          id: user._id,
          username: user.username,
          roleid: user.roleid
      }
  };

  // Generate the JWT
  return jwt.sign(payload, secretKey, {
    expiresIn: expiresIn,
  });
};

// Function to verify JWT token
const verifyJWT = (token) => {
  const secretKey = process.env.JWT_SECRET;
  
  if (!secretKey) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }

  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = { generateJWT, verifyJWT };
