/**
 * Sealed Secrets Controller API helpers
 *
 * Utilities for interacting with the sealed-secrets-controller HTTP API
 * via the Kubernetes API proxy.
 */

import { AsyncResult, Err, Ok, PEMCertificate, PluginConfig, tryCatchAsync } from '../types';
import { retryWithBackoff } from './retry';

/**
 * Controller health status information
 */
export interface ControllerHealthStatus {
  /** Whether the controller is healthy and responding */
  healthy: boolean;
  /** Whether the controller is reachable */
  reachable: boolean;
  /** Controller version if available */
  version?: string;
  /** Response latency in milliseconds */
  latencyMs?: number;
  /** Error message if not healthy */
  error?: string;
}

/**
 * Build the controller proxy URL
 */
function getControllerProxyURL(config: PluginConfig, path: string): string {
  const { controllerNamespace, controllerName, controllerPort } = config;
  return `/api/v1/namespaces/${controllerNamespace}/services/http:${controllerName}:${controllerPort}/proxy${path}`;
}

/**
 * Fetch the controller's public certificate (internal, no retry)
 */
async function fetchPublicCertificateOnce(
  config: PluginConfig
): AsyncResult<PEMCertificate, string> {
  const url = getControllerProxyURL(config, '/v1/cert.pem');

  const result = await tryCatchAsync(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch certificate: ${response.status} ${response.statusText}`);
    }
    return PEMCertificate(await response.text());
  });

  if (result.ok === false) {
    return Err(`Unable to fetch controller certificate: ${result.error.message}`);
  }

  return result;
}

/**
 * Fetch the controller's public certificate with retry logic
 *
 * Automatically retries on network errors with exponential backoff:
 * - Max 3 attempts
 * - Initial delay: 1s
 * - Max delay: 10s
 * - Exponential backoff with jitter
 *
 * @param config Plugin configuration
 * @returns Result containing PEM-encoded certificate (branded type) or error message
 */
export async function fetchPublicCertificate(
  config: PluginConfig
): AsyncResult<PEMCertificate, string> {
  return retryWithBackoff(() => fetchPublicCertificateOnce(config), {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
  });
}

/**
 * Rotate (re-encrypt) a SealedSecret with the current active key
 *
 * @param config Plugin configuration
 * @param sealedSecretYaml YAML or JSON of the SealedSecret
 * @returns Result containing the re-encrypted SealedSecret or error message
 */
export async function rotateSealedSecret(
  config: PluginConfig,
  sealedSecretYaml: string
): AsyncResult<string, string> {
  const url = getControllerProxyURL(config, '/v1/rotate');

  const result = await tryCatchAsync(async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: sealedSecretYaml,
    });

    if (!response.ok) {
      throw new Error(`Rotation failed: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  });

  if (result.ok === false) {
    return Err(`Unable to rotate SealedSecret: ${result.error.message}`);
  }

  return result;
}

/**
 * Get plugin configuration from localStorage
 */
export function getPluginConfig(): PluginConfig {
  const stored = localStorage.getItem('sealed-secrets-plugin-config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through to default
    }
  }

  // Return default config
  return {
    controllerName: 'sealed-secrets-controller',
    controllerNamespace: 'kube-system',
    controllerPort: 8080,
  };
}

/**
 * Save plugin configuration to localStorage
 */
export function savePluginConfig(config: PluginConfig): void {
  localStorage.setItem('sealed-secrets-plugin-config', JSON.stringify(config));
}

/**
 * Check controller health and reachability
 *
 * Attempts to reach the controller's health endpoint (/healthz) with a 5-second timeout.
 * Returns health status including latency and version information if available.
 *
 * @param config Plugin configuration
 * @returns Result containing health status (never fails - returns status even if unreachable)
 */
export async function checkControllerHealth(
  config: PluginConfig
): AsyncResult<ControllerHealthStatus, string> {
  const startTime = Date.now();

  try {
    const url = getControllerProxyURL(config, '/healthz');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return Ok({
        healthy: false,
        reachable: true,
        latencyMs,
        error: `HTTP ${response.status}: ${response.statusText}`,
      });
    }

    // Try to get version from headers
    const version = response.headers.get('X-Controller-Version') || undefined;

    return Ok({
      healthy: true,
      reachable: true,
      version,
      latencyMs,
    });
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;

    // Determine error type
    let errorMessage = 'Controller unreachable';
    if (error instanceof Error && error.name === 'AbortError') {
      errorMessage = 'Request timed out after 5 seconds';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return Ok({
      healthy: false,
      reachable: false,
      latencyMs,
      error: errorMessage,
    });
  }
}
