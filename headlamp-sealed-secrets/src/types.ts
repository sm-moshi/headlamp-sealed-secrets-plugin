/**
 * TypeScript interfaces for Bitnami Sealed Secrets plugin
 */

import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';

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
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Async result type for promises that can fail
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

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
export interface SealedSecretCondition {
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
 * Default plugin configuration
 */
export const DEFAULT_CONFIG: PluginConfig = {
  controllerName: 'sealed-secrets-controller',
  controllerNamespace: 'kube-system',
  controllerPort: 8080,
};

/**
 * Key-value pair for encryption dialog
 */
export interface SecretKeyValue {
  key: string;
  value: string;
}

/**
 * Encryption request parameters
 */
export interface EncryptionRequest {
  name: string;
  namespace: string;
  scope: SealedSecretScope;
  keyValues: SecretKeyValue[];
}
