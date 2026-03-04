/**
 * TypeScript interfaces for Bitnami Sealed Secrets plugin
 */

import { K8s } from '@kinvolk/headlamp-plugin/lib';

type KubeObjectInterface = K8s.cluster.KubeObjectInterface;

/**
 * Result type for operations that can fail
 * Replaces throw/catch with explicit error handling
 *
 * @example
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) return Err('Division by zero');
 *   return Ok(a / b);
 * }
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Async result type for promises that can fail
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Branded types for type-level security
 * These prevent mixing sensitive/non-sensitive values at compile time
 */

/** Unique symbol for branding plaintext values */
declare const PlaintextBrand: unique symbol;

/** Unique symbol for branding encrypted values */
declare const EncryptedBrand: unique symbol;

/** Unique symbol for branding base64-encoded values */
declare const Base64Brand: unique symbol;

/** Unique symbol for branding PEM certificates */
declare const PEMCertBrand: unique symbol;

/**
 * Plaintext sensitive value (not yet encrypted)
 * Must be explicitly created via PlaintextValue()
 */
export type PlaintextValue = string & { readonly [PlaintextBrand]: typeof PlaintextBrand };

/**
 * Encrypted value (already encrypted)
 * Created by encryption functions
 */
export type EncryptedValue = string & { readonly [EncryptedBrand]: typeof EncryptedBrand };

/**
 * Base64-encoded string
 * Created by base64 encoding functions
 */
export type Base64String = string & { readonly [Base64Brand]: typeof Base64Brand };

/**
 * PEM-encoded certificate
 * Created by certificate parsing functions
 */
export type PEMCertificate = string & { readonly [PEMCertBrand]: typeof PEMCertBrand };

/**
 * Create a branded plaintext value
 * Use this to mark user input as plaintext before encryption
 *
 * @example
 * const secret = PlaintextValue('my-password');
 */
export function PlaintextValue(value: string): PlaintextValue {
  return value as PlaintextValue;
}

/**
 * Create a branded base64 string
 *
 * @example
 * return Ok(Base64String(encoded));
 */
export function Base64String(value: string): Base64String {
  return value as Base64String;
}

/**
 * Create a branded PEM certificate
 *
 * @example
 * return Ok(PEMCertificate(certPem));
 */
export function PEMCertificate(value: string): PEMCertificate {
  return value as PEMCertificate;
}

/**
 * Helper to create a success result
 *
 * @example
 * return Ok(42);
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Helper to create an error result
 *
 * @example
 * return Err('Something went wrong');
 * return Err(new Error('Something went wrong'));
 */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Convert a throwing function to a Result-returning function
 *
 * @example
 * const safeParseJSON = tryCatch(JSON.parse);
 * const result = safeParseJSON('{"key": "value"}');
 * if (result.ok) {
 *   console.log(result.value);
 * }
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return Ok(fn());
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Convert an async throwing function to an AsyncResult
 *
 * @example
 * const safeFetch = tryCatchAsync(() => fetch('/api/data'));
 * const result = await safeFetch();
 */
export async function tryCatchAsync<T>(fn: () => Promise<T>): AsyncResult<T, Error> {
  try {
    const value = await fn();
    return Ok(value);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Sealed Secret scope types
 */
export type SealedSecretScope = 'strict' | 'namespace-wide' | 'cluster-wide';

/**
 * SealedSecret CRD spec
 */
export interface SealedSecretSpec {
  /** Map of key names to encrypted (base64-encoded) values */
  encryptedData: Record<string, string>;
  /** Metadata template for the resulting Secret */
  template?: {
    metadata?: {
      labels?: Record<string, string>;
      annotations?: Record<string, string>;
    };
    type?: string;
  };
}

/**
 * SealedSecret status condition
 */
interface SealedSecretCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  lastTransitionTime?: string;
  lastUpdateTime?: string;
  reason?: string;
  message?: string;
}

/**
 * SealedSecret CRD status
 */
export interface SealedSecretStatus {
  conditions?: SealedSecretCondition[];
  observedGeneration?: number;
}

/**
 * Complete SealedSecret CRD interface
 */
export interface SealedSecretInterface extends KubeObjectInterface {
  spec: SealedSecretSpec;
  status?: SealedSecretStatus;
}

/**
 * Plugin configuration stored in localStorage
 */
export interface PluginConfig {
  /** Controller deployment name */
  controllerName: string;
  /** Controller namespace */
  controllerNamespace: string;
  /** Controller service port */
  controllerPort: number;
}

/**
 * Key-value pair for encryption dialog
 */
export interface SecretKeyValue {
  key: string;
  value: string;
}

/**
 * Certificate information extracted from PEM certificate
 */
export interface CertificateInfo {
  /** Validity period start date */
  validFrom: Date;
  /** Validity period end date */
  validTo: Date;
  /** Whether certificate is currently expired */
  isExpired: boolean;
  /** Days until expiry (negative if expired) */
  daysUntilExpiry: number;
  /** Certificate issuer (formatted as DN string) */
  issuer: string;
  /** Certificate subject (formatted as DN string) */
  subject: string;
  /** SHA-256 fingerprint of certificate */
  fingerprint: string;
  /** Serial number of certificate */
  serialNumber: string;
}
