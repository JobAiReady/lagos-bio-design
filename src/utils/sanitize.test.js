import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizeTags,
  sanitizeDescription,
  sanitizeFilename,
  sanitizeUrl,
  sanitizeInt,
  sanitizeObject,
  sanitizeDesignInput,
} from './sanitize';

/**
 * Test Suite for Input Sanitization Utilities
 * These tests verify XSS prevention, validation, and data normalization
 */

describe('sanitizeText', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>Hello'))
      .toBe('Hello');
  });

  it('should remove remaining angle brackets', () => {
    expect(sanitizeText('Hello <World>'))
      .toBe('Hello'); // Treated as a tag and removed
  });

  it('should trim whitespace', () => {
    expect(sanitizeText('  Hello World  '))
      .toBe('Hello World');
  });

  it('should handle empty string', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('should return empty string for non-string input', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeText(123)).toBe('');
  });

  it('should prevent XSS via nested tags', () => {
    expect(sanitizeText('<div><script>alert(1)</script></div>'))
      .toBe('');
  });

  it('should handle unicode characters', () => {
    expect(sanitizeText('Hello 世界 🌍'))
      .toBe('Hello 世界 🌍');
  });
});

describe('sanitizeEmail', () => {
  it('should validate and normalize correct email', () => {
    expect(sanitizeEmail('user@example.com'))
      .toBe('user@example.com');
  });

  it('should lowercase email addresses', () => {
    expect(sanitizeEmail('USER@EXAMPLE.COM'))
      .toBe('user@example.com');
  });

  it('should trim whitespace', () => {
    expect(sanitizeEmail('  user@example.com  '))
      .toBe('user@example.com');
  });

  it('should reject invalid email - no @ symbol', () => {
    expect(sanitizeEmail('not-an-email')).toBeNull();
  });

  it('should reject invalid email - missing domain', () => {
    expect(sanitizeEmail('user@')).toBeNull();
  });

  it('should reject invalid email - missing local part', () => {
    expect(sanitizeEmail('@example.com')).toBeNull();
  });

  it('should reject invalid email - spaces', () => {
    expect(sanitizeEmail('user name@example.com')).toBeNull();
  });

  it('should return null for non-string input', () => {
    expect(sanitizeEmail(null)).toBeNull();
    expect(sanitizeEmail(undefined)).toBeNull();
    expect(sanitizeEmail(123)).toBeNull();
  });

  it('should accept email with subdomains', () => {
    expect(sanitizeEmail('user@mail.example.com'))
      .toBe('user@mail.example.com');
  });

  it('should accept email with plus sign', () => {
    expect(sanitizeEmail('user+tag@example.com'))
      .toBe('user+tag@example.com');
  });
});

describe('sanitizeTags', () => {
  it('should sanitize array of tags', () => {
    const result = sanitizeTags(['Tag1', 'Tag2', 'Tag3']);
    expect(result).toEqual(['Tag1', 'Tag2', 'Tag3']);
  });

  it('should remove HTML from tags', () => {
    const result = sanitizeTags(['React', '<script>xss</script>', 'TypeScript']);
    expect(result).toEqual(['React', 'TypeScript']);
  });

  it('should remove empty tags', () => {
    const result = sanitizeTags(['Tag1', '', '   ', 'Tag2']);
    expect(result).toEqual(['Tag1', 'Tag2']);
  });

  it('should limit to maximum number of tags (default 10)', () => {
    const tags = Array(15).fill('tag');
    const result = sanitizeTags(tags);
    expect(result).toHaveLength(10);
  });

  it('should respect custom maxTags option', () => {
    const tags = Array(10).fill('tag');
    const result = sanitizeTags(tags, { maxTags: 5 });
    expect(result).toHaveLength(5);
  });

  it('should enforce max length per tag (default 30)', () => {
    const longTag = 'a'.repeat(50);
    const result = sanitizeTags([longTag, 'short']);
    expect(result).toEqual(['short']);
  });

  it('should respect custom maxLength option', () => {
    const result = sanitizeTags(['toolong', 'ok'], { maxLength: 5 });
    expect(result).toEqual(['ok']);
  });

  it('should return empty array for non-array input', () => {
    expect(sanitizeTags(null)).toEqual([]);
    expect(sanitizeTags(undefined)).toEqual([]);
    expect(sanitizeTags('not-array')).toEqual([]);
  });

  it('should trim whitespace from tags', () => {
    const result = sanitizeTags(['  Tag1  ', '  Tag2  ']);
    expect(result).toEqual(['Tag1', 'Tag2']);
  });
});

describe('sanitizeDescription', () => {
  it('should remove script tags', () => {
    const result = sanitizeDescription('<script>alert("xss")</script>Safe text');
    expect(result).toBe('Safe text');
  });

  it('should remove dangerous event handlers', () => {
    const result = sanitizeDescription('<div onclick="alert(1)">Text</div>');
    expect(result).not.toContain('onclick');
  });

  it('should remove javascript: URLs', () => {
    const result = sanitizeDescription('<a href="javascript:alert(1)">Link</a>');
    expect(result).not.toContain('javascript:');
  });

  it('should allow safe formatting tags', () => {
    const result = sanitizeDescription('<b>Bold</b> <i>Italic</i> <p>Paragraph</p>');
    expect(result).toContain('<b>');
    expect(result).toContain('<i>');
    expect(result).toContain('<p>');
  });

  it('should remove dangerous tags', () => {
    const result = sanitizeDescription('<iframe src="evil"></iframe>Text');
    expect(result).not.toContain('<iframe');
  });

  it('should enforce max length (default 5000)', () => {
    const longText = 'a'.repeat(6000);
    const result = sanitizeDescription(longText);
    expect(result.length).toBeLessThanOrEqual(5003); // 5000 + '...'
  });

  it('should respect custom maxLength option', () => {
    const result = sanitizeDescription('Hello World', { maxLength: 5 });
    expect(result).toBe('Hello...');
  });

  it('should return empty string for non-string input', () => {
    expect(sanitizeDescription(null)).toBe('');
    expect(sanitizeDescription(undefined)).toBe('');
  });
});

describe('sanitizeFilename', () => {
  it('should remove unsafe characters', () => {
    expect(sanitizeFilename('my file.pdb')).toBe('my-file.pdb');
  });

  it('should prevent directory traversal', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etc-passwd');
  });

  it('should lowercase filename', () => {
    expect(sanitizeFilename('MyFile.PDB')).toBe('myfile.pdb');
  });

  it('should remove leading dots', () => {
    expect(sanitizeFilename('...hidden.txt')).toBe('hidden.txt');
  });

  it('should replace multiple dashes', () => {
    expect(sanitizeFilename('my---file.txt')).toBe('my-file.txt');
  });

  it('should return "untitled" for non-string input', () => {
    expect(sanitizeFilename(null)).toBe('untitled');
    expect(sanitizeFilename(undefined)).toBe('untitled');
  });

  it('should enforce max length of 255 characters', () => {
    const longName = 'a'.repeat(300) + '.txt';
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(255);
  });
});

describe('sanitizeUrl', () => {
  it('should accept valid HTTPS URL', () => {
    expect(sanitizeUrl('https://example.com'))
      .toBe('https://example.com/');
  });

  it('should accept valid HTTP URL', () => {
    expect(sanitizeUrl('http://example.com'))
      .toBe('http://example.com/');
  });

  it('should reject javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('should reject data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('should reject file: protocol', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
  });

  it('should return null for invalid URL', () => {
    expect(sanitizeUrl('not a url')).toBeNull();
  });

  it('should return null for non-string input', () => {
    expect(sanitizeUrl(null)).toBeNull();
    expect(sanitizeUrl(undefined)).toBeNull();
  });

  it('should accept custom allowed protocols', () => {
    const result = sanitizeUrl('ftp://example.com', { allowedProtocols: ['ftp'] });
    expect(result).toBe('ftp://example.com/');
  });
});

describe('sanitizeInt', () => {
  it('should parse valid integer', () => {
    expect(sanitizeInt('42')).toBe(42);
  });

  it('should enforce minimum value', () => {
    expect(sanitizeInt('-10', { min: 0, default: 0 })).toBe(0);
  });

  it('should enforce maximum value', () => {
    expect(sanitizeInt('999', { max: 100, default: 100 })).toBe(100);
  });

  it('should return default for NaN', () => {
    expect(sanitizeInt('not a number', { default: 0 })).toBe(0);
  });

  it('should handle numeric input', () => {
    expect(sanitizeInt(42)).toBe(42);
  });

  it('should return default value if not specified', () => {
    expect(sanitizeInt('invalid')).toBe(0);
  });

  it('should accept negative numbers within range', () => {
    expect(sanitizeInt('-5', { min: -10, max: 10 })).toBe(-5);
  });
});

describe('sanitizeObject', () => {
  it('should remove functions from object', () => {
    const obj = { name: 'test', fn: () => { } };
    const result = sanitizeObject(obj);
    expect(result).toEqual({ name: 'test' });
  });

  it('should remove undefined values', () => {
    const obj = { name: 'test', undef: undefined };
    const result = sanitizeObject(obj);
    expect(result).toEqual({ name: 'test' });
  });

  it('should handle nested objects', () => {
    const obj = { outer: { inner: 'value', fn: () => { } } };
    const result = sanitizeObject(obj);
    expect(result).toEqual({ outer: { inner: 'value' } });
  });

  it('should preserve arrays', () => {
    const obj = { items: [1, 2, 3] };
    const result = sanitizeObject(obj);
    expect(result).toEqual({ items: [1, 2, 3] });
  });

  it('should return empty object for non-object input', () => {
    expect(sanitizeObject(null)).toEqual({});
    expect(sanitizeObject('string')).toEqual({});
    expect(sanitizeObject(123)).toEqual({});
  });
});

describe('sanitizeDesignInput', () => {
  it('should sanitize all fields', () => {
    const input = {
      title: '<script>xss</script>My Protein',
      description: 'Description with <script>',
      tags: ['Tag1', '', '<script>bad</script>', 'Tag2'],
    };

    const result = sanitizeDesignInput(input);

    expect(result.title).toBe('My Protein');
    expect(result.description).not.toContain('<script>');
    expect(result.tags).toEqual(['Tag1', 'Tag2']);
  });

  it('should handle missing fields', () => {
    const result = sanitizeDesignInput({});
    expect(result.title).toBe('');
    expect(result.description).toBe('');
    expect(result.tags).toEqual([]);
  });

  it('should combine multiple sanitization steps', () => {
    const input = {
      title: '  <b>Title</b>  ',
      description: '<script>bad</script>Good text<br>',
      tags: ['a'.repeat(100), 'valid'],
    };

    const result = sanitizeDesignInput(input);

    expect(result.title).toBe('Title');
    expect(result.description).toContain('Good text');
    expect(result.tags).toEqual(['valid']); // Long tag filtered out
  });
});
