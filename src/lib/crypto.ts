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
import {
  Base64String,
  CertificateInfo,
  Err,
  Ok,
  PEMCertificate,
  PlaintextValue,
  Result,
  SealedSecretScope,
} from '../types';

/**
 * Parse a PEM certificate and extract the RSA public key
 *
 * @param pemCert PEM-encoded certificate string (branded type)
 * @returns Result containing the public key or an error message
 */
export function parsePublicKeyFromCert(
  pemCert: PEMCertificate
): Result<forge.pki.rsa.PublicKey, string> {
  try {
    const cert = forge.pki.certificateFromPem(pemCert);
    const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
    return Ok(publicKey);
  } catch (error) {
    return Err(`Failed to parse certificate: ${error}`);
  }
}

/**
 * Encrypt a secret value using the kubeseal format
 *
 * @param publicKey RSA public key from the controller's certificate
 * @param value The plaintext secret value to encrypt (branded type)
 * @param namespace The namespace (for strict/namespace-wide scoping)
 * @param name The secret name (for strict scoping)
 * @param key The key name within the secret
 * @param scope The encryption scope
 * @returns Result containing base64-encoded encrypted value or error message
 */
function encryptValue(
  publicKey: forge.pki.rsa.PublicKey,
  value: PlaintextValue,
  namespace: string,
  name: string,
  key: string,
  scope: SealedSecretScope
): Result<Base64String, string> {
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
    const tag = (cipher.mode as { tag: forge.util.ByteStringBuffer }).tag.getBytes();

    // Construct the sealed secret format:
    // [2-byte key length][encrypted key][IV][ciphertext][auth tag]
    const sessionKeyLength = encryptedSessionKey.length;
    const lengthBytes =
      String.fromCharCode((sessionKeyLength >> 8) & 0xff) +
      String.fromCharCode(sessionKeyLength & 0xff);

    const payload = lengthBytes + encryptedSessionKey + iv + encryptedValue + tag;

    // Base64 encode the final payload
    return Ok(Base64String(forge.util.encode64(payload)));
  } catch (error) {
    return Err(`Encryption failed: ${error}`);
  }
}

/**
 * Encrypt multiple key-value pairs for a SealedSecret
 *
 * @param publicKey RSA public key from the controller's certificate
 * @param keyValues Array of {key, value} pairs to encrypt (values are branded plaintext)
 * @param namespace The namespace
 * @param name The secret name
 * @param scope The encryption scope
 * @returns Result containing object mapping keys to encrypted values, or error message
 */
export function encryptKeyValues(
  publicKey: forge.pki.rsa.PublicKey,
  keyValues: Array<{ key: string; value: PlaintextValue }>,
  namespace: string,
  name: string,
  scope: SealedSecretScope
): Result<Record<string, Base64String>, string> {
  const encryptedData: Record<string, Base64String> = {};

  for (const { key, value } of keyValues) {
    const result = encryptValue(publicKey, value, namespace, name, key, scope);

    if (result.ok === false) {
      return Err(`Failed to encrypt key '${key}': ${result.error}`);
    }

    encryptedData[key] = result.value;
  }

  return Ok(encryptedData);
}

/**
 * Parse certificate and extract metadata
 *
 * Extracts validity dates, issuer/subject information, and calculates
 * expiration status and fingerprint.
 *
 * @param pemCert PEM-encoded certificate string (branded type)
 * @returns Result containing certificate information or error message
 */
export function parseCertificateInfo(pemCert: PEMCertificate): Result<CertificateInfo, string> {
  try {
    const cert = forge.pki.certificateFromPem(pemCert);
    const now = new Date();

    // Extract validity dates
    const validFrom = cert.validity.notBefore;
    const validTo = cert.validity.notAfter;

    // Calculate expiration status
    const isExpired = now > validTo;
    const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Format issuer and subject
    const formatDN = (attributes: forge.pki.CertificateField[]): string => {
      return attributes.map(a => `${a.shortName}=${a.value}`).join(', ');
    };

    const issuer = formatDN(cert.issuer.attributes);
    const subject = formatDN(cert.subject.attributes);

    // Calculate SHA-256 fingerprint
    const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const md = forge.md.sha256.create();
    md.update(der);
    const fingerprint = md.digest().toHex().toUpperCase();

    // Get serial number
    const serialNumber = cert.serialNumber;

    return Ok({
      validFrom,
      validTo,
      isExpired,
      daysUntilExpiry,
      issuer,
      subject,
      fingerprint,
      serialNumber,
    });
  } catch (error) {
    return Err(`Failed to parse certificate info: ${error}`);
  }
}

/**
 * Check if certificate will expire soon (within threshold)
 *
 * @param info Certificate information
 * @param daysThreshold Number of days to consider "expiring soon" (default: 30)
 * @returns true if certificate will expire within threshold days
 */
export function isCertificateExpiringSoon(info: CertificateInfo, daysThreshold = 30): boolean {
  return !info.isExpired && info.daysUntilExpiry <= daysThreshold;
}
