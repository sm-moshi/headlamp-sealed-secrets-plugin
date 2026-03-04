/**
 * Runtime validators and type guards
 *
 * Provides validation functions for user input, configuration values,
 * and runtime type checking for SealedSecret objects.
 */

/**
 * Validate Kubernetes resource name
 *
 * Must match DNS-1123 subdomain:
 * - lowercase alphanumeric characters, '-' or '.'
 * - start and end with alphanumeric character
 * - max 253 characters
 *
 * @param name Name to validate
 * @returns true if valid Kubernetes resource name
 */
function isValidK8sName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 253) {
    return false;
  }

  // DNS-1123 subdomain format
  return /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(name);
}

/**
 * Validate Kubernetes label/annotation key
 *
 * @param key Key to validate
 * @returns true if valid Kubernetes key
 */
function isValidK8sKey(key: string): boolean {
  if (!key || key.length === 0 || key.length > 253) {
    return false;
  }

  // Simple alphanumeric key validation
  return /^[a-zA-Z0-9]([-_.a-zA-Z0-9]*[a-zA-Z0-9])?$/.test(key);
}

/**
 * Validate PEM certificate format
 *
 * Checks for BEGIN/END CERTIFICATE markers and basic structure
 *
 * @param value String to validate
 * @returns true if valid PEM format
 */
function isValidPEM(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Check for PEM markers and basic structure
  const pemRegex = /^-----BEGIN CERTIFICATE-----\s+[\s\S]+\s+-----END CERTIFICATE-----\s*$/;
  return pemRegex.test(value.trim());
}

/**
 * Validation result with error message
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate secret name with detailed error message
 *
 * @param name Secret name to validate
 * @returns Validation result with error message if invalid
 */
export function validateSecretName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Secret name is required' };
  }

  if (name.length > 253) {
    return { valid: false, error: 'Secret name must be 253 characters or less' };
  }

  if (!isValidK8sName(name)) {
    return {
      valid: false,
      error:
        'Secret name must be lowercase alphanumeric, may contain hyphens and dots, and must start/end with alphanumeric',
    };
  }

  return { valid: true };
}

/**
 * Validate secret key name with detailed error message
 *
 * @param key Key name to validate
 * @returns Validation result with error message if invalid
 */
export function validateSecretKey(key: string): ValidationResult {
  if (!key || key.trim().length === 0) {
    return { valid: false, error: 'Key name is required' };
  }

  if (key.length > 253) {
    return { valid: false, error: 'Key name must be 253 characters or less' };
  }

  if (!isValidK8sKey(key)) {
    return {
      valid: false,
      error: 'Key name must be alphanumeric and may contain hyphens, underscores, and dots',
    };
  }

  return { valid: true };
}

/**
 * Validate secret value (plaintext)
 *
 * @param value Secret value to validate
 * @returns Validation result with error message if invalid
 */
export function validateSecretValue(value: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { valid: false, error: 'Secret value is required' };
  }

  // Check for reasonable size limit (1MB)
  if (value.length > 1024 * 1024) {
    return { valid: false, error: 'Secret value must be less than 1MB' };
  }

  return { valid: true };
}

/**
 * Validate PEM certificate with detailed error message
 *
 * @param pem PEM certificate to validate
 * @returns Validation result with error message if invalid
 */
export function validatePEMCertificate(pem: string): ValidationResult {
  if (!pem || pem.trim().length === 0) {
    return { valid: false, error: 'Certificate is required' };
  }

  if (!isValidPEM(pem)) {
    return {
      valid: false,
      error: 'Invalid PEM format. Must contain BEGIN CERTIFICATE and END CERTIFICATE markers',
    };
  }

  return { valid: true };
}
