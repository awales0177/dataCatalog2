// Password utility functions
// Note: In a real application, use a proper hashing library like bcrypt
// This is a simplified version for demo purposes

/**
 * Simple password hashing for demo purposes
 * WARNING: In production, use proper hashing like bcrypt with salt
 * @param {string} password - Plain text password
 * @returns {string} - Hashed password
 */
export const hashPassword = (password) => {
  if (!password) return '';
  
  // Simple hash for demo - in production use bcrypt or similar
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Add some salt-like behavior
  const salt = 'data_catalog_salt_2024';
  return btoa(hash.toString() + salt);
};

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @returns {boolean} - Whether password matches
 */
export const verifyPassword = (password, hash) => {
  if (!password || !hash) return false;
  return hashPassword(password) === hash;
};
