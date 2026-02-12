/**
 * SealedSecret Custom Resource Definition
 */

import { apiFactoryWithNamespace } from '@kinvolk/headlamp-plugin/lib/lib/k8s/apiProxy';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import {
  SealedSecretInterface,
  SealedSecretScope,
  SealedSecretSpec,
  SealedSecretStatus,
} from '../types';

/**
 * SealedSecret CRD class
 * Represents a Bitnami Sealed Secret resource in the cluster
 */
export class SealedSecret extends KubeObject<SealedSecretInterface> {
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
    return condition.message || condition.reason || condition.status;
  }
}
