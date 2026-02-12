/**
 * TypeScript interfaces for Bitnami Sealed Secrets plugin
 */

import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';

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
