const jwt = require('jsonwebtoken');

/**
 * Verifies the refresh token.
 * @param {string} token - The refresh token to verify.
 * @returns {Promise<object>} A promise that resolves with the decoded token payload.
 */
const verifyRefreshToken = (token) => {
    return new Promise((resolve, reject) => {
        // Ensure REFRESH_TOKEN_SECRET is available
        const secretKey = process.env.REFRESH_TOKEN_SECRET;
        if (!secretKey) {
            console.error('REFRESH_TOKEN_SECRET is not set.');
            return reject(new Error('Server configuration error.'));
        }

        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                // Rejects with specific error for handling in the controller
                return reject(err);
            }
            resolve(decoded);
        });
    });
};

module.exports = { verifyRefreshToken };
