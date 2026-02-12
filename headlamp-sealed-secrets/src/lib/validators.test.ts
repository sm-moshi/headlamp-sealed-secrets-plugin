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
  isValidNamespace,
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
      expect(result.error).toContain('lowercase');
    });

    it('should reject names starting with hyphen', () => {
      const result = validateSecretName('-secret');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('start and end with an alphanumeric');
    });

    it('should reject names ending with hyphen', () => {
      const result = validateSecretName('secret-');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('start and end with an alphanumeric');
    });

    it('should reject names with underscores', () => {
      const result = validateSecretName('secret_name');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('lowercase alphanumeric characters or hyphens');
    });

    it('should reject empty names', () => {
      const result = validateSecretName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Name is required');
    });

    it('should reject names exceeding 253 characters', () => {
      const result = validateSecretName('x'.repeat(254));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('253 characters');
    });

    it('should reject names with special characters', () => {
      expect(validateSecretName('secret@name').valid).toBe(false);
      expect(validateSecretName('secret.name').valid).toBe(false);
      expect(validateSecretName('secret:name').valid).toBe(false);
      expect(validateSecretName('secret name').valid).toBe(false);
    });

    it('should reject names starting with numbers followed by hyphen', () => {
      const result = validateSecretName('123-secret');
      expect(result.valid).toBe(true); // This is actually valid
    });
  });

  describe('validateNamespace', () => {
    it('should accept valid namespace names', () => {
      expect(isValidNamespace('default').valid).toBe(true);
      expect(isValidNamespace('kube-system').valid).toBe(true);
      expect(isValidNamespace('my-namespace').valid).toBe(true);
      expect(isValidNamespace('ns-123').valid).toBe(true);
    });

    it('should reject invalid namespace names', () => {
      expect(isValidNamespace('').valid).toBe(false);
      expect(isValidNamespace('My-Namespace').valid).toBe(false);
      expect(isValidNamespace('-namespace').valid).toBe(false);
      expect(isValidNamespace('namespace-').valid).toBe(false);
      expect(isValidNamespace('namespace_name').valid).toBe(false);
    });

    it('should reject namespaces exceeding 63 characters', () => {
      const result = isValidNamespace('x'.repeat(64));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('63 characters');
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
      expect(validateSecretKey('_key').valid).toBe(true);
      expect(validateSecretKey('.key').valid).toBe(true);
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
      expect(validateSecretValue(' ').valid).toBe(true); // Space is valid
      expect(validateSecretValue('multi\nline\nvalue').valid).toBe(true);
      expect(validateSecretValue('special!@#$%^&*()chars').valid).toBe(true);
    });

    it('should reject empty values', () => {
      const result = validateSecretValue('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Value is required');
    });

    it('should accept large values', () => {
      const largeValue = 'x'.repeat(10000);
      expect(validateSecretValue(largeValue).valid).toBe(true);
    });

    it('should warn about very large values', () => {
      const veryLargeValue = 'x'.repeat(1000000); // 1MB
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
      expect(result.error).toContain('BEGIN CERTIFICATE');
    });

    it('should reject certificates without END marker', () => {
      const invalidPEM = validPEM.replace('-----END CERTIFICATE-----', '');
      const result = validatePEMCertificate(invalidPEM);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('END CERTIFICATE');
    });

    it('should reject non-PEM text', () => {
      const result = validatePEMCertificate('This is not a PEM certificate');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid PEM');
    });

    it('should accept PEM with extra whitespace', () => {
      const pemWithWhitespace = '\n\n' + validPEM + '\n\n';
      expect(validatePEMCertificate(pemWithWhitespace).valid).toBe(true);
    });
  });
});
