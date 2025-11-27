/**
 * Input Sanitization Utilities
 * 
 * These functions sanitize user input to prevent XSS attacks and other
 * security vulnerabilities. Use these before storing or displaying any
 * user-generated content.
 * 
 * @module utils/sanitize
 */

/**
 * Remove all HTML tags and trim whitespace
 * Use for: titles, names, short text fields
 * 
 * @param {string} input - The text to sanitize
 * @returns {string} - Sanitized text without HTML
 * 
 * @example
 * sanitizeText('<script>alert("xss")</script>Hello') // Returns: 'Hello'
 */
export const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/[<>]/g, '')     // Remove remaining < and >
    .trim();                   // Remove leading/trailing whitespace
};

/**
 * Validate and normalize email addresses
 * Use for: email input fields
 * 
 * @param {string} email - The email to validate
 * @returns {string|null} - Lowercase trimmed email or null if invalid
 * 
 * @example
 * sanitizeEmail('  USER@EXAMPLE.COM  ') // Returns: 'user@example.com'
 * sanitizeEmail('not-an-email') // Returns: null
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return null;
  
  const trimmed = email.trim().toLowerCase();
  
  // Basic email regex (RFC 5322 simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(trimmed) ? trimmed : null;
};

/**
 * Sanitize and validate an array of tags
 * Use for: tag input, categories, keywords
 * 
 * @param {string[]} tags - Array of tag strings
 * @param {Object} options - Configuration options
 * @param {number} options.maxTags - Maximum number of tags (default: 10)
 * @param {number} options.maxLength - Maximum length per tag (default: 30)
 * @returns {string[]} - Sanitized array of tags
 * 
 * @example
 * sanitizeTags(['React', '<script>xss</script>', '', 'TypeScript'])
 * // Returns: ['React', 'TypeScript']
 */
export const sanitizeTags = (tags, options = {}) => {
  const { maxTags = 10, maxLength = 30 } = options;
  
  if (!Array.isArray(tags)) return [];
  
  return tags
    .map(tag => sanitizeText(tag))           // Remove HTML from each tag
    .filter(tag => tag.length > 0)           // Remove empty tags
    .filter(tag => tag.length <= maxLength)  // Enforce max length
    .slice(0, maxTags);                      // Limit number of tags
};

/**
 * Sanitize longer text content (descriptions, comments)
 * Allows some safe formatting but removes dangerous HTML
 * Use for: descriptions, bio, comments
 * 
 * @param {string} text - The text to sanitize
 * @param {Object} options - Configuration options
 * @param {number} options.maxLength - Maximum length (default: 5000)
 * @returns {string} - Sanitized text
 * 
 * @example
 * sanitizeDescription('<script>bad</script>This is a description.')
 * // Returns: 'This is a description.'
 */
export const sanitizeDescription = (text, options = {}) => {
  const { maxLength = 5000 } = options;
  
  if (typeof text !== 'string') return '';
  
  // Remove script tags and their content
  let cleaned = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove potentially dangerous attributes
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove onclick, onerror, etc.
  cleaned = cleaned.replace(/javascript:/gi, '');                 // Remove javascript: URLs
  
  // Remove dangerous tags but keep safe formatting (b, i, p, br)
  const dangerousTags = /<(?!\/?(b|i|p|br|strong|em)\b)[^>]*>/gi;
  cleaned = cleaned.replace(dangerousTags, '');
  
  // Trim and enforce max length
  cleaned = cleaned.trim();
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength) + '...';
  }
  
  return cleaned;
};

/**
 * Sanitize filename for safe storage
 * Use for: file uploads, document names
 * 
 * @param {string} filename - The filename to sanitize
 * @returns {string} - Safe filename
 * 
 * @example
 * sanitizeFilename('../../../etc/passwd') // Returns: 'passwd'
 * sanitizeFilename('my file.pdb') // Returns: 'my-file.pdb'
 */
export const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') return 'untitled';
  
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '-')  // Replace unsafe chars with dash
    .replace(/\.{2,}/g, '.')            // Remove directory traversal (..)
    .replace(/^\.+/, '')                // Remove leading dots
    .replace(/-{2,}/g, '-')             // Replace multiple dashes with single
    .toLowerCase()                       // Lowercase for consistency
    .substring(0, 255);                  // Enforce max filename length
};

/**
 * Validate and sanitize URL
 * Use for: link inputs, redirects
 * 
 * @param {string} url - The URL to validate
 * @param {Object} options - Configuration options
 * @param {string[]} options.allowedProtocols - Allowed URL protocols (default: ['http', 'https'])
 * @returns {string|null} - Validated URL or null if invalid
 * 
 * @example
 * sanitizeUrl('javascript:alert(1)') // Returns: null
 * sanitizeUrl('https://example.com') // Returns: 'https://example.com'
 */
export const sanitizeUrl = (url, options = {}) => {
  const { allowedProtocols = ['http', 'https'] } = options;
  
  if (typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    
    // Check if protocol is allowed
    const protocol = parsed.protocol.replace(':', '');
    if (!allowedProtocols.includes(protocol)) {
      return null;
    }
    
    return parsed.href;
  } catch (e) {
    // Invalid URL
    return null;
  }
};

/**
 * Sanitize object for JSON storage
 * Removes undefined and functions to prevent JSON.stringify issues
 * Use for: storing objects in database
 * 
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - Sanitized object safe for JSON
 * 
 * @example
 * sanitizeObject({ name: 'test', fn: () => {}, undef: undefined })
 * // Returns: { name: 'test' }
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return {};
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip functions and undefined
    if (typeof value === 'function' || value === undefined) {
      continue;
    }
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate and sanitize integer input
 * Use for: numeric inputs, IDs, counts
 * 
 * @param {*} value - The value to parse as integer
 * @param {Object} options - Configuration options
 * @param {number} options.min - Minimum allowed value
 * @param {number} options.max - Maximum allowed value
 * @param {number} options.default - Default value if invalid
 * @returns {number} - Validated integer
 * 
 * @example
 * sanitizeInt('42', { min: 0, max: 100 }) // Returns: 42
 * sanitizeInt('999', { min: 0, max: 100, default: 0 }) // Returns: 0
 */
export const sanitizeInt = (value, options = {}) => {
  const { min = -Infinity, max = Infinity, default: defaultValue = 0 } = options;
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) return defaultValue;
  if (parsed < min) return defaultValue;
  if (parsed > max) return defaultValue;
  
  return parsed;
};

/**
 * Create a safe object from user input for PublishModal
 * Use for: combining multiple sanitization steps
 * 
 * @param {Object} input - Raw user input
 * @returns {Object} - Fully sanitized object
 * 
 * @example
 * sanitizeDesignInput({
 *   title: '<script>xss</script>My Protein',
 *   description: 'Description with <script>',
 *   tags: ['Tag1', '', '<script>bad</script>']
 * })
 */
export const sanitizeDesignInput = (input) => {
  return {
    title: sanitizeText(input.title || ''),
    description: sanitizeDescription(input.description || ''),
    tags: sanitizeTags(input.tags || []),
  };
};

// Export all functions as default for convenience
export default {
  sanitizeText,
  sanitizeEmail,
  sanitizeTags,
  sanitizeDescription,
  sanitizeFilename,
  sanitizeUrl,
  sanitizeObject,
  sanitizeInt,
  sanitizeDesignInput,
};
