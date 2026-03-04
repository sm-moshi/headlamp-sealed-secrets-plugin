/**
 * SealedSecret Custom Resource Definition
 */

import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';

const { apiFactoryWithNamespace } = ApiProxy;
const { KubeObject } = K8s.cluster;
import { AsyncResult, Err, Ok, tryCatchAsync } from '../types';
import {
  SealedSecretInterface,
  SealedSecretScope,
  SealedSecretSpec,
  SealedSecretStatus,
} from '../types';

interface CRDVersion {
  name: string;
  storage?: boolean;
  served?: boolean;
}

/**
 * SealedSecret CRD class
 * Represents a Bitnami Sealed Secret resource in the cluster
 */
export class SealedSecret extends KubeObject<SealedSecretInterface> {
  /**
   * Default API version (fallback)
   */
  static readonly DEFAULT_VERSION = 'bitnami.com/v1alpha1';

  /**
   * Cached detected API version
   */
  private static detectedVersion: string | null = null;

  /**
   * API endpoint for SealedSecret resources
   * bitnami.com/v1alpha1/sealedsecrets
   */
  static apiEndpoint = apiFactoryWithNamespace('bitnami.com', 'v1alpha1', 'sealedsecrets');

  /**
   * Class name used for Headlamp registration
   */
  static get className(): string {
    return 'SealedSecret';
  }

  /**
   * Get the SealedSecret spec
   */
  get spec(): SealedSecretSpec {
    return this.jsonData.spec;
  }

  /**
   * Get the SealedSecret status
   */
  get status(): SealedSecretStatus | undefined {
    return this.jsonData.status;
  }

  /**
   * Get the scope of this SealedSecret (strict, namespace-wide, or cluster-wide)
   */
  get scope(): SealedSecretScope {
    const annotations = this.metadata.annotations || {};

    if (annotations['sealedsecrets.bitnami.com/cluster-wide'] === 'true') {
      return 'cluster-wide';
    }
    if (annotations['sealedsecrets.bitnami.com/namespace-wide'] === 'true') {
      return 'namespace-wide';
    }
    return 'strict';
  }

  /**
   * Get the count of encrypted keys
   */
  get encryptedKeysCount(): number {
    return Object.keys(this.spec.encryptedData || {}).length;
  }

  /**
   * Check if the SealedSecret is synced
   */
  get isSynced(): boolean {
    const syncCondition = this.status?.conditions?.find(c => c.type === 'Synced');
    return syncCondition?.status === 'True';
  }

  /**
   * Get the sync status condition
   */
  get syncCondition() {
    return this.status?.conditions?.find(c => c.type === 'Synced');
  }

  /**
   * Get the sync status message
   */
  get syncMessage(): string {
    const condition = this.syncCondition;
    if (!condition) {
      return 'Unknown';
    }
    // Ensure we always return a string, not an object
    const message = condition.message || condition.reason || condition.status;
    return String(message || 'Unknown');
  }

  /**
   * Detect the API version available in the cluster
   *
   * Queries the SealedSecrets CRD to determine which API version is installed
   * and preferred. Returns the storage version (the version used for persisting
   * objects in etcd).
   *
   * @returns Result containing the API version string (e.g., "bitnami.com/v1alpha1")
   */
  static async detectApiVersion(): AsyncResult<string, string> {
    // Return cached version if available
    if (this.detectedVersion) {
      return Ok(this.detectedVersion);
    }

    const result = await tryCatchAsync(async () => {
      // Query the CRD to get available versions using Headlamp's API proxy
      const crd = await ApiProxy.request(
        '/apis/apiextensions.k8s.io/v1/customresourcedefinitions/sealedsecrets.bitnami.com'
      );

      // Find the storage version (the version used for persistence)
      const storageVersion = crd.spec?.versions?.find((v: CRDVersion) => v.storage === true);

      if (storageVersion) {
        const version = `${crd.spec.group}/${storageVersion.name}`;
        this.detectedVersion = version;
        return version;
      }

      // Fallback to first served version if no storage version found
      const servedVersion = crd.spec?.versions?.find((v: CRDVersion) => v.served === true);
      if (servedVersion) {
        const version = `${crd.spec.group}/${servedVersion.name}`;
        this.detectedVersion = version;
        return version;
      }

      // Ultimate fallback to default
      return this.DEFAULT_VERSION;
    });

    if (result.ok === false) {
      return Err(result.error.message);
    }

    return Ok(result.value);
  }

  /**
   * Get API endpoint with auto-detected version
   *
   * Automatically detects and uses the correct API version from the cluster.
   * Falls back to default version (v1alpha1) if detection fails.
   *
   * @returns API endpoint configured with the detected version
   */
  static async getApiEndpoint() {
    const versionResult = await this.detectApiVersion();

    if (versionResult.ok) {
      const [group, version] = versionResult.value.split('/');
      return apiFactoryWithNamespace(group, version, 'sealedsecrets');
    }

    // Fallback to default endpoint
    return this.apiEndpoint;
  }

  /**
   * Get the detected API version
   *
   * Returns the cached detected version or null if not yet detected.
   *
   * @returns The detected API version string or null
   */
  static getDetectedVersion(): string | null {
    return this.detectedVersion;
  }

  /**
   * Clear the cached API version
   *
   * Forces re-detection on next call to detectApiVersion().
   * Useful for refreshing after CRD updates.
   */
  static clearVersionCache(): void {
    this.detectedVersion = null;
  }
}
