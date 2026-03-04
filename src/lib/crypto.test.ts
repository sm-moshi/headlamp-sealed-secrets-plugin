/**
 * Unit tests for client-side encryption utilities
 */

import forge from 'node-forge';
import { beforeAll, describe, expect, it } from 'vitest';
import { PEMCertificate, PlaintextValue } from '../types';
import {
  encryptKeyValues,
  isCertificateExpiringSoon,
  parseCertificateInfo,
  parsePublicKeyFromCert,
} from './crypto';

// Generate a real self-signed cert for testing
let validPEM: PEMCertificate;
let expiredPEM: PEMCertificate;
let expiringSoonPEM: PEMCertificate;

beforeAll(() => {
  // Generate RSA key pair
  const keys = forge.pki.rsa.generateKeyPair(2048);

  // Valid cert (expires in 365 days)
  const validCert = forge.pki.createCertificate();
  validCert.publicKey = keys.publicKey;
  validCert.serialNumber = '01';
  validCert.validity.notBefore = new Date();
  validCert.validity.notAfter = new Date();
  validCert.validity.notAfter.setFullYear(validCert.validity.notAfter.getFullYear() + 1);
  validCert.setSubject([{ name: 'commonName', value: 'test-controller' }]);
  validCert.setIssuer([{ name: 'commonName', value: 'test-issuer' }]);
  validCert.sign(keys.privateKey, forge.md.sha256.create());
  validPEM = PEMCertificate(forge.pki.certificateToPem(validCert));

  // Expired cert
  const expiredCert = forge.pki.createCertificate();
  expiredCert.publicKey = keys.publicKey;
  expiredCert.serialNumber = '02';
  expiredCert.validity.notBefore = new Date('2020-01-01');
  expiredCert.validity.notAfter = new Date('2021-01-01');
  expiredCert.setSubject([{ name: 'commonName', value: 'expired-controller' }]);
  expiredCert.setIssuer([{ name: 'commonName', value: 'test-issuer' }]);
  expiredCert.sign(keys.privateKey, forge.md.sha256.create());
  expiredPEM = PEMCertificate(forge.pki.certificateToPem(expiredCert));

  // Expiring soon cert (15 days from now)
  const expiringSoonCert = forge.pki.createCertificate();
  expiringSoonCert.publicKey = keys.publicKey;
  expiringSoonCert.serialNumber = '03';
  expiringSoonCert.validity.notBefore = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 15);
  expiringSoonCert.validity.notAfter = expiryDate;
  expiringSoonCert.setSubject([{ name: 'commonName', value: 'expiring-controller' }]);
  expiringSoonCert.setIssuer([{ name: 'commonName', value: 'test-issuer' }]);
  expiringSoonCert.sign(keys.privateKey, forge.md.sha256.create());
  expiringSoonPEM = PEMCertificate(forge.pki.certificateToPem(expiringSoonCert));
});

describe('crypto', () => {
  describe('parsePublicKeyFromCert', () => {
    it('should parse valid PEM certificate', () => {
      const result = parsePublicKeyFromCert(validPEM);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeDefined();
        expect(result.value.n).toBeDefined(); // RSA modulus
        expect(result.value.e).toBeDefined(); // RSA exponent
      }
    });

    it('should return error for invalid PEM', () => {
      const result = parsePublicKeyFromCert(PEMCertificate('not a cert'));
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toContain('Failed to parse certificate');
      }
    });

    it('should return error for empty string', () => {
      const result = parsePublicKeyFromCert(PEMCertificate(''));
      expect(result.ok).toBe(false);
    });

    it('should return error for malformed PEM markers', () => {
      const result = parsePublicKeyFromCert(
        PEMCertificate('-----BEGIN CERTIFICATE-----\ninvalid\n-----END CERTIFICATE-----')
      );
      expect(result.ok).toBe(false);
    });
  });

  describe('encryptKeyValues', () => {
    it('should encrypt key-value pairs with strict scope', () => {
      const keyResult = parsePublicKeyFromCert(validPEM);
      expect(keyResult.ok).toBe(true);
      if (!keyResult.ok) return;

      const result = encryptKeyValues(
        keyResult.value,
        [{ key: 'password', value: PlaintextValue('secret123') }],
        'default',
        'my-secret',
        'strict'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveProperty('password');
        // Should be base64 encoded
        expect(() => forge.util.decode64(result.value.password)).not.toThrow();
      }
    });

    it('should encrypt with namespace-wide scope', () => {
      const keyResult = parsePublicKeyFromCert(validPEM);
      if (!keyResult.ok) return;

      const result = encryptKeyValues(
        keyResult.value,
        [{ key: 'token', value: PlaintextValue('abc') }],
        'prod',
        'my-secret',
        'namespace-wide'
      );

      expect(result.ok).toBe(true);
    });

    it('should encrypt with cluster-wide scope', () => {
      const keyResult = parsePublicKeyFromCert(validPEM);
      if (!keyResult.ok) return;

      const result = encryptKeyValues(
        keyResult.value,
        [{ key: 'key', value: PlaintextValue('val') }],
        'ns',
        'name',
        'cluster-wide'
      );

      expect(result.ok).toBe(true);
    });

    it('should encrypt multiple keys', () => {
      const keyResult = parsePublicKeyFromCert(validPEM);
      if (!keyResult.ok) return;

      const result = encryptKeyValues(
        keyResult.value,
        [
          { key: 'username', value: PlaintextValue('admin') },
          { key: 'password', value: PlaintextValue('secret') },
          { key: 'token', value: PlaintextValue('abc123') },
        ],
        'default',
        'my-secret',
        'strict'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Object.keys(result.value)).toHaveLength(3);
        expect(result.value).toHaveProperty('username');
        expect(result.value).toHaveProperty('password');
        expect(result.value).toHaveProperty('token');
      }
    });

    it('should produce different ciphertext for same plaintext (randomness)', () => {
      const keyResult = parsePublicKeyFromCert(validPEM);
      if (!keyResult.ok) return;

      const encrypt = () =>
        encryptKeyValues(
          keyResult.value,
          [{ key: 'key', value: PlaintextValue('same-value') }],
          'ns',
          'name',
          'strict'
        );

      const result1 = encrypt();
      const result2 = encrypt();

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.key).not.toBe(result2.value.key);
      }
    });

    it('should handle empty key-value array', () => {
      const keyResult = parsePublicKeyFromCert(validPEM);
      if (!keyResult.ok) return;

      const result = encryptKeyValues(keyResult.value, [], 'ns', 'name', 'strict');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Object.keys(result.value)).toHaveLength(0);
      }
    });
  });

  describe('parseCertificateInfo', () => {
    it('should parse valid certificate info', () => {
      const result = parseCertificateInfo(validPEM);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.validFrom).toBeInstanceOf(Date);
        expect(result.value.validTo).toBeInstanceOf(Date);
        expect(result.value.isExpired).toBe(false);
        expect(result.value.daysUntilExpiry).toBeGreaterThan(0);
        expect(result.value.subject).toContain('test-controller');
        expect(result.value.issuer).toContain('test-issuer');
        expect(result.value.fingerprint).toBeDefined();
        expect(result.value.serialNumber).toBeDefined();
      }
    });

    it('should detect expired certificate', () => {
      const result = parseCertificateInfo(expiredPEM);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isExpired).toBe(true);
        expect(result.value.daysUntilExpiry).toBeLessThan(0);
      }
    });

    it('should calculate days until expiry for expiring-soon cert', () => {
      const result = parseCertificateInfo(expiringSoonPEM);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isExpired).toBe(false);
        expect(result.value.daysUntilExpiry).toBeLessThanOrEqual(15);
        expect(result.value.daysUntilExpiry).toBeGreaterThanOrEqual(14);
      }
    });

    it('should return error for invalid PEM', () => {
      const result = parseCertificateInfo(PEMCertificate('not a cert'));
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toContain('Failed to parse certificate info');
      }
    });

    it('should compute SHA-256 fingerprint', () => {
      const result = parseCertificateInfo(validPEM);
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Fingerprint should be uppercase hex
        expect(result.value.fingerprint).toMatch(/^[0-9A-F]+$/);
        expect(result.value.fingerprint.length).toBe(64); // SHA-256 = 32 bytes = 64 hex chars
      }
    });
  });

  describe('isCertificateExpiringSoon', () => {
    it('should return true when within threshold', () => {
      const result = parseCertificateInfo(expiringSoonPEM);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(isCertificateExpiringSoon(result.value, 30)).toBe(true);
      }
    });

    it('should return false when not within threshold', () => {
      const result = parseCertificateInfo(validPEM);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(isCertificateExpiringSoon(result.value, 30)).toBe(false);
      }
    });

    it('should return false for expired certificate', () => {
      const result = parseCertificateInfo(expiredPEM);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(isCertificateExpiringSoon(result.value, 30)).toBe(false);
      }
    });

    it('should work with custom thresholds', () => {
      const result = parseCertificateInfo(expiringSoonPEM);
      expect(result.ok).toBe(true);
      if (result.ok) {
        // 15-day cert should be within 20-day threshold
        expect(isCertificateExpiringSoon(result.value, 20)).toBe(true);
        // But not within 10-day threshold
        expect(isCertificateExpiringSoon(result.value, 10)).toBe(false);
      }
    });
  });
});
