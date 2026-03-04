/**
 * Unit tests for validators
 *
 * Tests validation functions for Kubernetes names, secret keys, and values
 */

// Mock localStorage before importing any modules that might use it
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};
(global as any).localStorage = localStorageMock;

import { describe, expect, it } from 'vitest';
import {
  validatePEMCertificate,
  validateSecretKey,
  validateSecretName,
  validateSecretValue,
} from './validators';

describe('validators', () => {
  describe('validateSecretName', () => {
    it('should accept valid Kubernetes names', () => {
      expect(validateSecretName('my-secret').valid).toBe(true);
      expect(validateSecretName('secret-123').valid).toBe(true);
      expect(validateSecretName('a').valid).toBe(true);
      expect(validateSecretName('test-secret-name').valid).toBe(true);
      expect(validateSecretName('x'.repeat(253)).valid).toBe(true); // Max length
    });

    it('should reject names with uppercase letters', () => {
      const result = validateSecretName('My-Secret');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject names starting with hyphen', () => {
      const result = validateSecretName('-secret');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject names ending with hyphen', () => {
      const result = validateSecretName('secret-');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject names with underscores', () => {
      const result = validateSecretName('secret_name');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject empty names', () => {
      const result = validateSecretName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject names exceeding 253 characters', () => {
      const result = validateSecretName('x'.repeat(254));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('253 characters');
    });

    it('should reject names with special characters', () => {
      expect(validateSecretName('secret@name').valid).toBe(false);
      expect(validateSecretName('secret:name').valid).toBe(false);
      expect(validateSecretName('secret name').valid).toBe(false);
    });

    it('should accept names starting with numbers', () => {
      const result = validateSecretName('123-secret');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateSecretKey', () => {
    it('should accept valid secret keys', () => {
      expect(validateSecretKey('password').valid).toBe(true);
      expect(validateSecretKey('api-key').valid).toBe(true);
      expect(validateSecretKey('api_key').valid).toBe(true);
      expect(validateSecretKey('api.key').valid).toBe(true);
      expect(validateSecretKey('API_KEY').valid).toBe(true);
      expect(validateSecretKey('key123').valid).toBe(true);
    });

    it('should reject empty keys', () => {
      const result = validateSecretKey('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Key name is required');
    });

    it('should reject keys with invalid characters', () => {
      expect(validateSecretKey('key@name').valid).toBe(false);
      expect(validateSecretKey('key name').valid).toBe(false);
      expect(validateSecretKey('key:name').valid).toBe(false);
      expect(validateSecretKey('key/name').valid).toBe(false);
    });

    it('should reject keys exceeding 253 characters', () => {
      const result = validateSecretKey('x'.repeat(254));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('253 characters');
    });
  });

  describe('validateSecretValue', () => {
    it('should accept non-empty values', () => {
      expect(validateSecretValue('password123').valid).toBe(true);
      expect(validateSecretValue('a').valid).toBe(true);
      expect(validateSecretValue('multi\nline\nvalue').valid).toBe(true);
      expect(validateSecretValue('special!@#$%^&*()chars').valid).toBe(true);
    });

    it('should reject empty values', () => {
      const result = validateSecretValue('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should accept large values', () => {
      const largeValue = 'x'.repeat(10000);
      expect(validateSecretValue(largeValue).valid).toBe(true);
    });

    it('should reject values exceeding 1MB', () => {
      const veryLargeValue = 'x'.repeat(1024 * 1024 + 1);
      const result = validateSecretValue(veryLargeValue);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('1MB');
    });
  });

  describe('validatePEMCertificate', () => {
    const validPEM = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAKHHCgVZU1M0MA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMMBnRl
c3RjYTAeFw0yNDAxMDEwMDAwMDBaFw0yNTAxMDEwMDAwMDBaMBExDzANBgNVBAMM
BnRlc3RjYTCBnzANBgkqhkiG9w0BAQEFAAOBjQAwgYkCgYEAwKX5UvKZU8rKFXJN
uTGBGGfLYmNHJ6U3kS7hVf8TQPKqKqEQ7vVwVnDFPFLPmqDYnVQH2hN4Z6YpXqKY
KKKKKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq
KqKqKqKqKqKqKqKqKqKqKqIBAgMBAAEwDQYJKoZIhvcNAQELBQADgYEAoKKKKqKq
KqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq
KqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq
KqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq
KqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq
KqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq
-----END CERTIFICATE-----`;

    it('should accept valid PEM certificates', () => {
      expect(validatePEMCertificate(validPEM).valid).toBe(true);
    });

    it('should reject empty certificates', () => {
      const result = validatePEMCertificate('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject certificates without BEGIN marker', () => {
      const invalidPEM = validPEM.replace('-----BEGIN CERTIFICATE-----', '');
      const result = validatePEMCertificate(invalidPEM);
      expect(result.valid).toBe(false);
    });

    it('should reject certificates without END marker', () => {
      const invalidPEM = validPEM.replace('-----END CERTIFICATE-----', '');
      const result = validatePEMCertificate(invalidPEM);
      expect(result.valid).toBe(false);
    });

    it('should reject non-PEM text', () => {
      const result = validatePEMCertificate('This is not a PEM certificate');
      expect(result.valid).toBe(false);
    });

    it('should accept PEM with extra whitespace', () => {
      const pemWithWhitespace = '\n\n' + validPEM + '\n\n';
      expect(validatePEMCertificate(pemWithWhitespace).valid).toBe(true);
    });
  });
});
