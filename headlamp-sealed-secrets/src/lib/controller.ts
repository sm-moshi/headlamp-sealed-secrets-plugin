/**
 * Sealed Secrets Controller API helpers
 *
 * Utilities for interacting with the sealed-secrets-controller HTTP API
 * via the Kubernetes API proxy.
 */

import { AsyncResult, Err, PluginConfig, tryCatchAsync } from '../types';

/**
 * Build the controller proxy URL
 */
export function getControllerProxyURL(config: PluginConfig, path: string): string {
  const { controllerNamespace, controllerName, controllerPort } = config;
  return `/api/v1/namespaces/${controllerNamespace}/services/http:${controllerName}:${controllerPort}/proxy${path}`;
}

/**
 * Fetch the controller's public certificate
 *
 * @param config Plugin configuration
 * @returns Result containing PEM-encoded certificate or error message
 */
export async function fetchPublicCertificate(
  config: PluginConfig
): AsyncResult<string, string> {
  const url = getControllerProxyURL(config, '/v1/cert.pem');

  const result = await tryCatchAsync(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch certificate: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  });

  if (result.ok === false) {
    return Err(`Unable to fetch controller certificate: ${result.error.message}`);
  }

  return result;
}

/**
 * Verify that a SealedSecret can be decrypted by the controller
 *
 * @param config Plugin configuration
 * @param sealedSecretYaml YAML or JSON of the SealedSecret
 * @returns Result containing verification status or error message
 */
export async function verifySealedSecret(
  config: PluginConfig,
  sealedSecretYaml: string
): AsyncResult<boolean, string> {
  const url = getControllerProxyURL(config, '/v1/verify');

  const result = await tryCatchAsync(async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: sealedSecretYaml,
    });

    return response.ok;
  });

  if (result.ok === false) {
    return Err(`Verification failed: ${result.error.message}`);
  }

  return result;
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
