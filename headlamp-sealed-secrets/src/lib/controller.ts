/**
 * Sealed Secrets Controller API helpers
 *
 * Utilities for interacting with the sealed-secrets-controller HTTP API
 * via the Kubernetes API proxy.
 */

import { request } from '@kinvolk/headlamp-plugin/lib/lib/k8s/apiProxy';
import { PluginConfig } from '../types';

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
 * @returns PEM-encoded certificate
 */
export async function fetchPublicCertificate(config: PluginConfig): Promise<string> {
  const url = getControllerProxyURL(config, '/v1/cert.pem');

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch certificate: ${response.status} ${response.statusText}`);
    }
    const cert = await response.text();
    return cert;
  } catch (error) {
    throw new Error(`Unable to fetch controller certificate: ${error}`);
  }
}

/**
 * Verify that a SealedSecret can be decrypted by the controller
 *
 * @param config Plugin configuration
 * @param sealedSecretYaml YAML or JSON of the SealedSecret
 */
export async function verifySealedSecret(
  config: PluginConfig,
  sealedSecretYaml: string
): Promise<boolean> {
  const url = getControllerProxyURL(config, '/v1/verify');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: sealedSecretYaml,
    });

    return response.ok;
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
}

/**
 * Rotate (re-encrypt) a SealedSecret with the current active key
 *
 * @param config Plugin configuration
 * @param sealedSecretYaml YAML or JSON of the SealedSecret
 * @returns The re-encrypted SealedSecret
 */
export async function rotateSealedSecret(
  config: PluginConfig,
  sealedSecretYaml: string
): Promise<string> {
  const url = getControllerProxyURL(config, '/v1/rotate');

  try {
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
  } catch (error) {
    throw new Error(`Unable to rotate SealedSecret: ${error}`);
  }
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
