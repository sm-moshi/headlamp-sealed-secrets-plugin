/**
 * Client-side encryption utilities for Sealed Secrets
 *
 * This module handles the encryption of secret values using the sealed-secrets
 * controller's public key. The encryption process matches the kubeseal CLI tool:
 *
 * 1. Generate a random AES-256-GCM session key
 * 2. Encrypt the secret value with the session key
 * 3. Encrypt the session key with the RSA public key (OAEP + SHA-256)
 * 4. Construct the payload: 2-byte length prefix + encrypted session key + encrypted data
 * 5. Base64-encode the result
 */

import forge from 'node-forge';
import { SealedSecretScope } from '../types';

/**
 * Parse a PEM certificate and extract the RSA public key
 */
export function parsePublicKeyFromCert(pemCert: string): forge.pki.rsa.PublicKey {
  try {
    const cert = forge.pki.certificateFromPem(pemCert);
    const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
    return publicKey;
  } catch (error) {
    throw new Error(`Failed to parse certificate: ${error}`);
  }
}

/**
 * Encrypt a secret value using the kubeseal format
 *
 * @param publicKey RSA public key from the controller's certificate
 * @param value The plaintext secret value to encrypt
 * @param namespace The namespace (for strict/namespace-wide scoping)
 * @param name The secret name (for strict scoping)
 * @param key The key name within the secret
 * @param scope The encryption scope
 * @returns Base64-encoded encrypted value
 */
export function encryptValue(
  publicKey: forge.pki.rsa.PublicKey,
  value: string,
  namespace: string,
  name: string,
  key: string,
  scope: SealedSecretScope
): string {
  try {
    // Generate a random 32-byte (256-bit) AES session key
    const sessionKey = forge.random.getBytesSync(32);

    // Construct the label for RSA-OAEP based on scope
    // This binds the encryption to specific namespace/name/key depending on scope
    let label = '';
    if (scope === 'strict') {
      // Strict scope: namespace.name.key
      label = `${namespace}.${name}.${key}`;
    } else if (scope === 'namespace-wide') {
      // Namespace-wide scope: namespace.key
      label = `${namespace}.${key}`;
    } else {
      // Cluster-wide scope: just the key
      label = key;
    }

    // Encrypt the session key with RSA-OAEP (SHA-256)
    const encryptedSessionKey = publicKey.encrypt(sessionKey, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create(),
      },
      label: label,
    });

    // Encrypt the actual secret value with AES-256-GCM
    const iv = forge.random.getBytesSync(12); // 12 bytes for GCM
    const cipher = forge.cipher.createCipher('AES-GCM', sessionKey);
    cipher.start({ iv: iv });
    cipher.update(forge.util.createBuffer(value, 'utf8'));
    cipher.finish();

    const encryptedValue = cipher.output.getBytes();
    const tag = (cipher.mode as any).tag.getBytes();

    // Construct the sealed secret format:
    // [2-byte length of encrypted session key][encrypted session key][IV][encrypted value][auth tag]
    const sessionKeyLength = encryptedSessionKey.length;
    const lengthBytes = String.fromCharCode((sessionKeyLength >> 8) & 0xff) +
                        String.fromCharCode(sessionKeyLength & 0xff);

    const payload = lengthBytes + encryptedSessionKey + iv + encryptedValue + tag;

    // Base64 encode the final payload
    return forge.util.encode64(payload);
  } catch (error) {
    throw new Error(`Encryption failed: ${error}`);
  }
}

/**
 * Encrypt multiple key-value pairs for a SealedSecret
 *
 * @param publicKey RSA public key from the controller's certificate
 * @param keyValues Array of {key, value} pairs to encrypt
 * @param namespace The namespace
 * @param name The secret name
 * @param scope The encryption scope
 * @returns Object mapping keys to encrypted values
 */
export function encryptKeyValues(
  publicKey: forge.pki.rsa.PublicKey,
  keyValues: Array<{ key: string; value: string }>,
  namespace: string,
  name: string,
  scope: SealedSecretScope
): Record<string, string> {
  const encryptedData: Record<string, string> = {};

  for (const { key, value } of keyValues) {
    encryptedData[key] = encryptValue(publicKey, value, namespace, name, key, scope);
  }

  return encryptedData;
}

/**
 * Validate a PEM certificate
 */
export function validateCertificate(pemCert: string): boolean {
  try {
    parsePublicKeyFromCert(pemCert);
    return true;
  } catch {
    return false;
  }
}
