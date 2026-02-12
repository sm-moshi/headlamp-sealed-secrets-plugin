# Headlamp Sealed Secrets Plugin - Enhancement Implementation Plan

**Version:** 1.0
**Date:** 2026-02-11
**Contributors:** TypeScript-Pro, Kubernetes-Specialist, React-Specialist

---

## 📋 Executive Summary

This document outlines a comprehensive enhancement plan for the Headlamp Sealed Secrets plugin based on collaborative analysis from TypeScript, Kubernetes, and React specialists. The plan is organized into 4 implementation phases spanning approximately 6-8 weeks of development time.

**Key Goals:**
- Improve type safety and error handling
- Enhance Kubernetes integration and RBAC awareness
- Optimize React performance and UX
- Strengthen security and reliability

---

## 🎯 Phase 1: Foundation & Type Safety (Week 1-2)

**Focus:** Establish robust type system and error handling patterns

### 1.1 Result Types for Error Handling
**Priority:** HIGH
**Effort:** 1-2 days
**Dependencies:** None

**Implementation:**
```typescript
// File: src/types.ts

/**
 * Result type for operations that can fail
 * Replaces throw/catch with explicit error handling
 */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Helper to create success result
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Helper to create error result
 */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

**Files to Update:**
- `src/lib/crypto.ts` - All encryption functions
- `src/lib/controller.ts` - All API calls
- `src/components/EncryptDialog.tsx` - Error handling logic
- `src/components/DecryptDialog.tsx` - Error handling logic

**Testing:**
- Unit tests for Result type helpers
- Integration tests for crypto operations
- Error path testing for controller API calls

---

### 1.2 Branded Types for Security
**Priority:** HIGH
**Effort:** 1 day
**Dependencies:** 1.1 (Result types)

**Implementation:**
```typescript
// File: src/types.ts

/**
 * Branded types to prevent mixing sensitive values
 */
export type Brand<T, B> = T & { __brand: B };

export type EncryptedValue = Brand<string, 'encrypted'>;
export type PlaintextValue = Brand<string, 'plaintext'>;
export type Base64String = Brand<string, 'base64'>;
export type PEMCertificate = Brand<string, 'pem-cert'>;

/**
 * Type guards and constructors
 */
export function toEncrypted(value: string): EncryptedValue {
  return value as EncryptedValue;
}

export function toPlaintext(value: string): PlaintextValue {
  return value as PlaintextValue;
}

export function toBase64(value: string): Base64String {
  return value as Base64String;
}

export function toPEM(value: string): PEMCertificate {
  return value as PEMCertificate;
}
```

**Files to Update:**
- `src/lib/crypto.ts` - Use branded types for inputs/outputs
- `src/types.ts` - Update interfaces to use branded types
- `src/components/EncryptDialog.tsx` - Type-safe value handling
- `src/components/DecryptDialog.tsx` - Type-safe value handling

**Testing:**
- Type-level tests (compile-time)
- Runtime validation tests

---

### 1.3 Type Guards and Validators
**Priority:** MEDIUM
**Effort:** 1 day
**Dependencies:** 1.2 (Branded types)

**Implementation:**
```typescript
// File: src/lib/validators.ts

import { SealedSecret } from './lib/SealedSecretCRD';
import { SealedSecretInterface, SealedSecretScope } from './types';

/**
 * Runtime type guard for SealedSecret
 */
export function isSealedSecret(obj: any): obj is SealedSecret {
  return (
    obj instanceof SealedSecret &&
    obj.jsonData &&
    'spec' in obj.jsonData &&
    'encryptedData' in obj.jsonData.spec
  );
}

/**
 * Validate SealedSecret structure
 */
export function validateSealedSecretInterface(obj: any): obj is SealedSecretInterface {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'spec' in obj &&
    typeof obj.spec === 'object' &&
    'encryptedData' in obj.spec &&
    typeof obj.spec.encryptedData === 'object'
  );
}

/**
 * Validate scope value
 */
export function isSealedSecretScope(value: any): value is SealedSecretScope {
  return ['strict', 'namespace-wide', 'cluster-wide'].includes(value);
}

/**
 * Validate Kubernetes resource name
 */
export function isValidK8sName(name: string): boolean {
  return /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name);
}

/**
 * Validate PEM certificate format
 */
export function isValidPEM(value: string): boolean {
  return /^-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----\s*$/.test(value);
}
```

**Files to Update:**
- Create `src/lib/validators.ts`
- Update `src/lib/crypto.ts` - Use validators
- Update `src/components/EncryptDialog.tsx` - Validate inputs

**Testing:**
- Unit tests for all validators
- Edge case testing (malformed input)

---

### 1.4 Generic Utility Types
**Priority:** LOW
**Effort:** 0.5 days
**Dependencies:** None

**Implementation:**
```typescript
// File: src/types.ts

/**
 * Form state management type
 */
export type FormState<T> = {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
};

/**
 * Async operation state
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

/**
 * Loadable data type
 */
export type Loadable<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Deep partial (recursive)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific keys required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
```

**Files to Use:**
- `src/components/EncryptDialog.tsx` - FormState for form management
- Custom hooks (Phase 2) - AsyncState for data fetching

**Testing:**
- Type-level tests

---

## 🔷 Phase 2: Kubernetes Integration Enhancement (Week 3-4)

**Focus:** Production-ready Kubernetes features and RBAC

### 2.1 Certificate Validation & Expiry Checking
**Priority:** HIGH
**Effort:** 2 days
**Dependencies:** 1.1 (Result types), 1.2 (Branded types)

**Implementation:**
```typescript
// File: src/lib/crypto.ts

import forge from 'node-forge';
import { PEMCertificate, Result, Ok, Err } from '../types';

export interface CertificateInfo {
  publicKey: forge.pki.rsa.PublicKey;
  validFrom: Date;
  validTo: Date;
  isExpired: boolean;
  daysUntilExpiry: number;
  issuer: string;
  subject: string;
  fingerprint: string;
}

/**
 * Parse certificate with full validation
 */
export function parseCertificateWithValidation(
  pemCert: PEMCertificate
): Result<CertificateInfo, string> {
  try {
    const cert = forge.pki.certificateFromPem(pemCert);
    const now = new Date();
    const validTo = cert.validity.notAfter;
    const validFrom = cert.validity.notBefore;

    // Check validity period
    if (now < validFrom) {
      return Err('Certificate is not yet valid');
    }

    if (now > validTo) {
      return Err('Certificate has expired');
    }

    // Calculate fingerprint
    const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const md = forge.md.sha256.create();
    md.update(der);
    const fingerprint = md.digest().toHex();

    return Ok({
      publicKey: cert.publicKey as forge.pki.rsa.PublicKey,
      validFrom,
      validTo,
      isExpired: now > validTo,
      daysUntilExpiry: Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      issuer: cert.issuer.attributes.map(a => `${a.shortName}=${a.value}`).join(', '),
      subject: cert.subject.attributes.map(a => `${a.shortName}=${a.value}`).join(', '),
      fingerprint,
    });
  } catch (error) {
    return Err(`Failed to parse certificate: ${error}`);
  }
}

/**
 * Check if certificate will expire soon (within 30 days)
 */
export function isCertificateExpiringSoon(info: CertificateInfo, daysThreshold = 30): boolean {
  return !info.isExpired && info.daysUntilExpiry <= daysThreshold;
}
```

**Files to Update:**
- `src/lib/crypto.ts` - Add certificate validation
- `src/components/SealingKeysView.tsx` - Display certificate info
- `src/components/EncryptDialog.tsx` - Warn on expiring cert

**Testing:**
- Test with expired certificates
- Test with not-yet-valid certificates
- Test expiry warning thresholds

---

### 2.2 Controller Health Check
**Priority:** HIGH
**Effort:** 1.5 days
**Dependencies:** 1.1 (Result types)

**Implementation:**
```typescript
// File: src/lib/controller.ts

export interface ControllerHealthStatus {
  healthy: boolean;
  version?: string;
  reachable: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * Check controller health and version
 */
export async function checkControllerHealth(
  config: PluginConfig
): Promise<Result<ControllerHealthStatus, string>> {
  const startTime = Date.now();

  try {
    const url = getControllerProxyURL(config, '/healthz');
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return Ok({
        healthy: false,
        reachable: true,
        latencyMs,
        error: `HTTP ${response.status}: ${response.statusText}`,
      });
    }

    // Try to get version from headers or response
    const version = response.headers.get('X-Controller-Version') || undefined;

    return Ok({
      healthy: true,
      reachable: true,
      version,
      latencyMs,
    });
  } catch (error: any) {
    return Ok({
      healthy: false,
      reachable: false,
      error: error.message || 'Controller unreachable',
    });
  }
}

/**
 * Get controller info (version, supported features)
 */
export async function getControllerInfo(
  config: PluginConfig
): Promise<Result<{ version: string; features: string[] }, string>> {
  try {
    // Some controllers expose /v1/version or similar
    const url = getControllerProxyURL(config, '/v1/version');
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return Ok(data);
    }

    return Err('Version endpoint not available');
  } catch (error: any) {
    return Err(error.message);
  }
}
```

**Files to Update:**
- `src/lib/controller.ts` - Add health check functions
- Create `src/components/ControllerStatus.tsx` - Health indicator
- `src/components/SettingsPage.tsx` - Show health status

**Testing:**
- Test with unreachable controller
- Test with healthy controller
- Test timeout scenarios

---

### 2.3 RBAC Permission Checking
**Priority:** HIGH
**Effort:** 2 days
**Dependencies:** 1.1 (Result types)

**Implementation:**
```typescript
// File: src/lib/rbac.ts

export interface ResourcePermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canList: boolean;
}

/**
 * Check user permissions for SealedSecrets
 */
export async function checkSealedSecretPermissions(
  namespace?: string
): Promise<Result<ResourcePermissions, string>> {
  try {
    const permissions: ResourcePermissions = {
      canCreate: await checkPermission('create', 'sealedsecrets', namespace),
      canRead: await checkPermission('get', 'sealedsecrets', namespace),
      canUpdate: await checkPermission('update', 'sealedsecrets', namespace),
      canDelete: await checkPermission('delete', 'sealedsecrets', namespace),
      canList: await checkPermission('list', 'sealedsecrets', namespace),
    };

    return Ok(permissions);
  } catch (error: any) {
    return Err(`Failed to check permissions: ${error.message}`);
  }
}

/**
 * Check a specific permission using SelfSubjectAccessReview
 */
async function checkPermission(
  verb: string,
  resource: string,
  namespace?: string
): Promise<boolean> {
  try {
    const reviewRequest = {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'bitnami.com',
          resource,
          verb,
          ...(namespace && { namespace }),
        },
      },
    };

    const response = await fetch('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewRequest),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.status?.allowed === true;
  } catch {
    return false;
  }
}

/**
 * Check if user can decrypt secrets (needs get permission on Secret)
 */
export async function canDecryptSecrets(namespace: string): Promise<boolean> {
  try {
    return await checkPermission('get', 'secrets', namespace);
  } catch {
    return false;
  }
}
```

**Files to Update:**
- Create `src/lib/rbac.ts`
- `src/components/SealedSecretList.tsx` - Hide create button if no permission
- `src/components/SealedSecretDetail.tsx` - Hide decrypt if no permission
- Create `src/hooks/usePermissions.ts` - React hook for permissions

**Testing:**
- Test with different RBAC configurations
- Test cluster-admin vs limited user
- Test namespace-scoped permissions

---

### 2.4 API Version Detection & Compatibility
**Priority:** MEDIUM
**Effort:** 1.5 days
**Dependencies:** 1.1 (Result types)

**Implementation:**
```typescript
// File: src/lib/SealedSecretCRD.ts

export class SealedSecret extends KubeObject<SealedSecretInterface> {
  static SUPPORTED_API_VERSIONS = ['bitnami.com/v1alpha1', 'bitnami.com/v1'] as const;
  static DEFAULT_VERSION = 'bitnami.com/v1alpha1';

  private static detectedVersion?: string;

  /**
   * Detect available API version from cluster
   */
  static async detectApiVersion(): Promise<Result<string, string>> {
    if (this.detectedVersion) {
      return Ok(this.detectedVersion);
    }

    try {
      // Try to get CRD definition
      const response = await fetch(
        '/apis/apiextensions.k8s.io/v1/customresourcedefinitions/sealedsecrets.bitnami.com'
      );

      if (!response.ok) {
        return Err('SealedSecrets CRD not found');
      }

      const crd = await response.json();

      // Get preferred version from CRD
      const preferredVersion = crd.spec?.versions?.find((v: any) => v.storage === true);
      if (preferredVersion) {
        const version = `${crd.spec.group}/${preferredVersion.name}`;
        this.detectedVersion = version;
        return Ok(version);
      }

      return Ok(this.DEFAULT_VERSION);
    } catch (error: any) {
      return Err(`Failed to detect API version: ${error.message}`);
    }
  }

  /**
   * Get API endpoint with auto-detected version
   */
  static async getApiEndpoint() {
    const versionResult = await this.detectApiVersion();

    if (versionResult.ok) {
      const [group, version] = versionResult.value.split('/');
      return apiFactoryWithNamespace(group, version, 'sealedsecrets');
    }

    // Fallback to default
    return this.apiEndpoint;
  }
}
```

**Files to Update:**
- `src/lib/SealedSecretCRD.ts` - Add version detection
- `src/components/SealedSecretList.tsx` - Use detected version
- Create `src/components/VersionWarning.tsx` - Warn on version mismatch

**Testing:**
- Test with v1alpha1
- Test with v1 (when available)
- Test with missing CRD

---

### 2.5 Multi-Cluster Support
**Priority:** LOW
**Effort:** 2 days
**Dependencies:** 2.1, 2.2

**Implementation:**
```typescript
// File: src/types.ts

export interface ClusterControllerConfig {
  clusterId: string;
  clusterName: string;
  controller: PluginConfig;
  lastHealthCheck?: Date;
  healthStatus?: ControllerHealthStatus;
}

export interface MultiClusterConfig {
  clusters: Record<string, ClusterControllerConfig>;
  defaultCluster?: string;
}

// File: src/lib/multicluster.ts

export function getMultiClusterConfig(): MultiClusterConfig {
  const stored = localStorage.getItem('sealed-secrets-multicluster-config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through
    }
  }

  return { clusters: {} };
}

export function saveClusterConfig(
  clusterId: string,
  config: ClusterControllerConfig
): void {
  const multiConfig = getMultiClusterConfig();
  multiConfig.clusters[clusterId] = config;
  localStorage.setItem('sealed-secrets-multicluster-config', JSON.stringify(multiConfig));
}
```

**Files to Update:**
- `src/types.ts` - Add multi-cluster types
- Create `src/lib/multicluster.ts`
- `src/components/SettingsPage.tsx` - Multi-cluster UI

**Testing:**
- Test with multiple clusters
- Test cluster switching
- Test config persistence

---

## ⚛️ Phase 3: React Performance & UX (Week 5-6)

**Focus:** Component optimization and user experience

### 3.1 Custom Hooks for Business Logic
**Priority:** HIGH
**Effort:** 2 days
**Dependencies:** 1.1 (Result types), 2.3 (RBAC)

**Implementation:**
```typescript
// File: src/hooks/useSealedSecretEncryption.ts

import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { encryptKeyValues, parseCertificateWithValidation } from '../lib/crypto';
import { fetchPublicCertificate, getPluginConfig } from '../lib/controller';
import { EncryptionRequest, Result } from '../types';

export interface EncryptionResult {
  encryptedData: Record<string, string>;
  certificateInfo: CertificateInfo;
}

export function useSealedSecretEncryption() {
  const [encrypting, setEncrypting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const encrypt = useCallback(async (
    request: EncryptionRequest
  ): Promise<Result<EncryptionResult, string>> => {
    setEncrypting(true);

    try {
      // 1. Fetch certificate
      const config = getPluginConfig();
      const pemCert = await fetchPublicCertificate(config);

      // 2. Validate certificate
      const certResult = parseCertificateWithValidation(pemCert);
      if (!certResult.ok) {
        return { ok: false, error: certResult.error };
      }

      const certInfo = certResult.value;

      // 3. Warn if expiring soon
      if (isCertificateExpiringSoon(certInfo)) {
        enqueueSnackbar(
          `Warning: Certificate expires in ${certInfo.daysUntilExpiry} days`,
          { variant: 'warning' }
        );
      }

      // 4. Encrypt values
      const encryptedData = encryptKeyValues(
        certInfo.publicKey,
        request.keyValues,
        request.namespace,
        request.name,
        request.scope
      );

      return {
        ok: true,
        value: {
          encryptedData,
          certificateInfo: certInfo,
        },
      };
    } catch (error: any) {
      return { ok: false, error: error.message };
    } finally {
      setEncrypting(false);
    }
  }, [enqueueSnackbar]);

  return { encrypt, encrypting };
}

// File: src/hooks/usePermissions.ts

import { useEffect, useState } from 'react';
import { checkSealedSecretPermissions, ResourcePermissions } from '../lib/rbac';

export function usePermissions(namespace?: string) {
  const [permissions, setPermissions] = useState<ResourcePermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    checkSealedSecretPermissions(namespace).then(result => {
      if (mounted && result.ok) {
        setPermissions(result.value);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [namespace]);

  return { permissions, loading };
}

// File: src/hooks/useControllerHealth.ts

import { useEffect, useState } from 'react';
import { checkControllerHealth, ControllerHealthStatus } from '../lib/controller';
import { getPluginConfig } from '../lib/controller';

export function useControllerHealth(intervalMs = 30000) {
  const [health, setHealth] = useState<ControllerHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const config = getPluginConfig();
      const result = await checkControllerHealth(config);

      if (result.ok) {
        setHealth(result.value);
        setLoading(false);
      }
    };

    check();
    const interval = setInterval(check, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return { health, loading };
}
```

**Files to Update:**
- Create `src/hooks/useSealedSecretEncryption.ts`
- Create `src/hooks/usePermissions.ts`
- Create `src/hooks/useControllerHealth.ts`
- `src/components/EncryptDialog.tsx` - Use encryption hook
- `src/components/SealedSecretList.tsx` - Use permissions hook

**Testing:**
- Unit tests for hooks
- Test hook with various permissions
- Test encryption hook error paths

---

### 3.2 Form Validation with Zod
**Priority:** HIGH
**Effort:** 1.5 days
**Dependencies:** 3.1 (Custom hooks)

**Implementation:**
```typescript
// File: package.json - Add dependencies
{
  "dependencies": {
    "zod": "^3.22.4"
  }
}

// File: src/lib/validation.ts

import { z } from 'zod';

/**
 * Kubernetes name validation schema
 */
const k8sNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(253, 'Name must be less than 253 characters')
  .regex(
    /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
    'Name must consist of lowercase alphanumeric characters or "-", and must start and end with an alphanumeric character'
  );

/**
 * Secret key validation
 */
const secretKeySchema = z
  .string()
  .min(1, 'Key name is required')
  .regex(
    /^[-._a-zA-Z0-9]+$/,
    'Key must consist of alphanumeric characters, "-", "_", or "."'
  );

/**
 * Encryption form validation schema
 */
export const encryptionFormSchema = z.object({
  name: k8sNameSchema,
  namespace: z.string().min(1, 'Namespace is required'),
  scope: z.enum(['strict', 'namespace-wide', 'cluster-wide']),
  keyValues: z
    .array(
      z.object({
        key: secretKeySchema,
        value: z.string().min(1, 'Value is required'),
      })
    )
    .min(1, 'At least one key-value pair is required')
    .refine(
      items => {
        const keys = items.map(item => item.key);
        return keys.length === new Set(keys).size;
      },
      { message: 'Duplicate keys are not allowed' }
    ),
});

export type EncryptionFormData = z.infer<typeof encryptionFormSchema>;

/**
 * Plugin config validation schema
 */
export const pluginConfigSchema = z.object({
  controllerName: k8sNameSchema,
  controllerNamespace: k8sNameSchema,
  controllerPort: z.number().min(1).max(65535),
});
```

**Files to Update:**
- Add `zod` dependency to package.json
- Create `src/lib/validation.ts`
- `src/components/EncryptDialog.tsx` - Add Zod validation
- `src/components/SettingsPage.tsx` - Validate config

**Testing:**
- Test all validation rules
- Test edge cases (empty, special chars)
- Test error messages

---

### 3.3 Performance Optimization (useMemo/useCallback)
**Priority:** MEDIUM
**Effort:** 1 day
**Dependencies:** None

**Implementation:**
```typescript
// File: src/components/SealedSecretList.tsx

import React, { useMemo, useCallback } from 'react';

export function SealedSecretList() {
  const [sealedSecrets, error] = SealedSecret.useList();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  // Memoize columns definition (stable reference)
  const columns = useMemo(() => [
    {
      label: 'Name',
      getter: (ss: SealedSecret) => (
        <Link
          routeName="sealedsecret"
          params={{
            namespace: ss.metadata.namespace,
            name: ss.metadata.name,
          }}
        >
          {ss.metadata.name}
        </Link>
      ),
    },
    {
      label: 'Namespace',
      getter: (ss: SealedSecret) => ss.metadata.namespace,
    },
    {
      label: 'Encrypted Keys',
      getter: (ss: SealedSecret) => ss.encryptedKeysCount,
    },
    {
      label: 'Scope',
      getter: (ss: SealedSecret) => formatScope(ss.scope),
    },
    {
      label: 'Sync Status',
      getter: (ss: SealedSecret) => (
        <StatusLabel status={ss.isSynced ? 'success' : 'error'}>
          {ss.isSynced ? 'Synced' : 'Not Synced'}
        </StatusLabel>
      ),
    },
    {
      label: 'Age',
      getter: (ss: SealedSecret) => ss.getAge(),
    },
  ], []);

  // Memoize processed data
  const tableData = useMemo(() => {
    if (!sealedSecrets) return [];

    return sealedSecrets.map(ss => ({
      ...ss,
      _formattedScope: formatScope(ss.scope),
    }));
  }, [sealedSecrets]);

  // Memoize callbacks
  const handleCreateDialogOpen = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCreateDialogClose = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  // ... rest of component
}

// File: src/components/EncryptDialog.tsx

export function EncryptDialog({ open, onClose }: EncryptDialogProps) {
  // ... state declarations

  // Memoize callbacks to prevent re-renders
  const handleAddKeyValue = useCallback(() => {
    setKeyValues(prev => [...prev, { key: '', value: '', showValue: false }]);
  }, []);

  const handleRemoveKeyValue = useCallback((index: number) => {
    setKeyValues(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyChange = useCallback((index: number, key: string) => {
    setKeyValues(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], key };
      return updated;
    });
  }, []);

  const handleValueChange = useCallback((index: number, value: string) => {
    setKeyValues(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  }, []);

  // ... rest of component
}
```

**Files to Update:**
- `src/components/SealedSecretList.tsx` - Add memoization
- `src/components/EncryptDialog.tsx` - Add memoization
- `src/components/SealedSecretDetail.tsx` - Add memoization

**Testing:**
- Performance benchmarks
- Re-render count testing with React DevTools

---

### 3.4 Error Boundaries
**Priority:** MEDIUM
**Effort:** 1 day
**Dependencies:** None

**Implementation:**
```typescript
// File: src/components/CryptoErrorBoundary.tsx

import React, { Component, ReactNode } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class CryptoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Crypto operation failed:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box p={3}>
          <Alert
            severity="error"
            icon={<ErrorOutline />}
            action={
              <Button color="inherit" size="small" onClick={this.handleReset}>
                Retry
              </Button>
            }
          >
            <Typography variant="h6" gutterBottom>
              Cryptographic Operation Failed
            </Typography>
            <Typography variant="body2" paragraph>
              An error occurred during encryption or decryption. This might indicate:
            </Typography>
            <ul style={{ margin: 0 }}>
              <li>Invalid or expired controller certificate</li>
              <li>Browser cryptography compatibility issue</li>
              <li>Malformed secret data</li>
            </ul>
            {this.state.error && (
              <Typography variant="body2" sx={{ mt: 2, fontFamily: 'monospace' }}>
                Error: {this.state.error.message}
              </Typography>
            )}
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

// File: src/components/ApiErrorBoundary.tsx

export class ApiErrorBoundary extends Component<Props, State> {
  // Similar structure but for API errors
  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error">
          <Typography variant="h6">API Error</Typography>
          <Typography variant="body2">
            Failed to communicate with the Kubernetes API or Sealed Secrets controller.
            Please check your connection and controller configuration.
          </Typography>
        </Alert>
      );
    }
    return this.props.children;
  }
}
```

**Files to Update:**
- Create `src/components/CryptoErrorBoundary.tsx`
- Create `src/components/ApiErrorBoundary.tsx`
- `src/components/EncryptDialog.tsx` - Wrap crypto operations
- `src/components/DecryptDialog.tsx` - Wrap crypto operations
- `src/index.tsx` - Root-level error boundary

**Testing:**
- Trigger errors intentionally
- Test recovery mechanism
- Test error reporting

---

### 3.5 Loading States & Skeleton UI
**Priority:** MEDIUM
**Effort:** 1 day
**Dependencies:** None

**Implementation:**
```typescript
// File: src/components/LoadingSkeletons.tsx

import React from 'react';
import { Box, Skeleton } from '@mui/material';

export function SealedSecretListSkeleton() {
  return (
    <Box p={2}>
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={60}
          sx={{ mb: 1, borderRadius: 1 }}
        />
      ))}
    </Box>
  );
}

export function SealedSecretDetailSkeleton() {
  return (
    <Box p={3}>
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={150} />
    </Box>
  );
}

export function CertificateInfoSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="50%" />
    </Box>
  );
}

// File: src/components/SealedSecretList.tsx

import { SealedSecretListSkeleton } from './LoadingSkeletons';

export function SealedSecretList() {
  const [sealedSecrets, error, loading] = SealedSecret.useList();

  if (loading) {
    return (
      <SectionBox title="Sealed Secrets">
        <SealedSecretListSkeleton />
      </SectionBox>
    );
  }

  // ... rest of component
}
```

**Files to Update:**
- Create `src/components/LoadingSkeletons.tsx`
- `src/components/SealedSecretList.tsx` - Add skeleton
- `src/components/SealedSecretDetail.tsx` - Add skeleton
- `src/components/SealingKeysView.tsx` - Add skeleton

**Testing:**
- Visual testing with slow network
- Screenshot tests

---

### 3.6 Accessibility Improvements
**Priority:** MEDIUM
**Effort:** 1.5 days
**Dependencies:** None

**Implementation:**
```typescript
// File: src/components/EncryptDialog.tsx

export function EncryptDialog({ open, onClose }: EncryptDialogProps) {
  // ... existing code

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="encrypt-dialog-title"
      aria-describedby="encrypt-dialog-description"
    >
      <DialogTitle id="encrypt-dialog-title">
        Create Sealed Secret
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }} id="encrypt-dialog-description">
          <TextField
            fullWidth
            label="Secret Name"
            value={name}
            onChange={e => setName(e.target.value)}
            margin="normal"
            required
            inputProps={{
              'aria-label': 'Secret name',
              'aria-required': true,
              'aria-invalid': !name && touched,
            }}
            helperText="Must be a valid Kubernetes resource name"
          />

          {/* ... other fields ... */}

          {keyValues.map((kv, index) => (
            <Box
              key={index}
              sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}
              role="group"
              aria-label={`Secret key-value pair ${index + 1}`}
            >
              <TextField
                label="Key Name"
                value={kv.key}
                onChange={e => handleKeyChange(index, e.target.value)}
                sx={{ flex: 1 }}
                inputProps={{
                  'aria-label': `Key name ${index + 1}`,
                }}
              />
              <TextField
                label="Secret Value"
                type={kv.showValue ? 'text' : 'password'}
                value={kv.value}
                onChange={e => handleValueChange(index, e.target.value)}
                sx={{ flex: 2 }}
                autoComplete="off"
                spellCheck={false}
                inputProps={{
                  'aria-label': `Secret value for ${kv.key || `key ${index + 1}`}`,
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => toggleShowValue(index)}
                      edge="end"
                      aria-label={kv.showValue ? 'Hide password' : 'Show password'}
                      tabIndex={0}
                    >
                      {kv.showValue ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
              <IconButton
                onClick={() => handleRemoveKeyValue(index)}
                disabled={keyValues.length === 1}
                color="error"
                aria-label={`Remove key-value pair ${index + 1}`}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={handleAddKeyValue}
            aria-label="Add another key-value pair"
          >
            Add Another Key
          </Button>

          <Box
            sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}
            role="note"
            aria-live="polite"
          >
            <Typography variant="body2">
              <strong>Security Note:</strong> Secret values are encrypted entirely in your browser
              using the controller's public key. The plaintext values never leave your machine.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={encrypting}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={encrypting}
          aria-busy={encrypting}
        >
          {encrypting ? 'Encrypting & Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

**Files to Update:**
- All dialog components - Add ARIA labels
- All form inputs - Add proper labels and descriptions
- All buttons - Add aria-label where needed
- All status indicators - Add aria-live regions

**Testing:**
- Screen reader testing (NVDA/JAWS)
- Keyboard navigation testing
- Lighthouse accessibility audit

---

## 🧪 Phase 4: Testing & Documentation (Week 7-8)

**Focus:** Comprehensive testing and documentation

### 4.1 Unit Tests for Core Logic
**Priority:** HIGH
**Effort:** 3 days
**Dependencies:** All previous phases

**Implementation:**
```typescript
// File: src/lib/crypto.test.ts

import { describe, it, expect } from 'vitest';
import {
  encryptValue,
  encryptKeyValues,
  parsePublicKeyFromCert,
  parseCertificateWithValidation,
  isCertificateExpiringSoon,
} from './crypto';
import { generateTestCertificate } from '../test-utils/cert-generator';

describe('crypto', () => {
  describe('parseCertificateWithValidation', () => {
    it('should parse valid certificate', () => {
      const pemCert = generateTestCertificate({ daysValid: 365 });
      const result = parseCertificateWithValidation(pemCert);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isExpired).toBe(false);
        expect(result.value.daysUntilExpiry).toBeGreaterThan(0);
      }
    });

    it('should reject expired certificate', () => {
      const pemCert = generateTestCertificate({ daysValid: -10 });
      const result = parseCertificateWithValidation(pemCert);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('expired');
      }
    });

    it('should detect expiring certificate', () => {
      const pemCert = generateTestCertificate({ daysValid: 15 });
      const result = parseCertificateWithValidation(pemCert);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(isCertificateExpiringSoon(result.value, 30)).toBe(true);
      }
    });
  });

  describe('encryptValue', () => {
    it('should encrypt value with correct scope', () => {
      const cert = generateTestCertificate();
      const certInfo = parseCertificateWithValidation(cert);

      if (!certInfo.ok) throw new Error('Test setup failed');

      const encrypted = encryptValue(
        certInfo.value.publicKey,
        'my-secret-value',
        'default',
        'my-secret',
        'password',
        'strict'
      );

      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
      // Base64 encoded
      expect(/^[A-Za-z0-9+/=]+$/.test(encrypted)).toBe(true);
    });
  });

  describe('encryptKeyValues', () => {
    it('should encrypt multiple key-value pairs', () => {
      const cert = generateTestCertificate();
      const certInfo = parseCertificateWithValidation(cert);

      if (!certInfo.ok) throw new Error('Test setup failed');

      const keyValues = [
        { key: 'username', value: 'admin' },
        { key: 'password', value: 'secret123' },
      ];

      const encrypted = encryptKeyValues(
        certInfo.value.publicKey,
        keyValues,
        'default',
        'my-secret',
        'strict'
      );

      expect(Object.keys(encrypted)).toHaveLength(2);
      expect(encrypted.username).toBeTruthy();
      expect(encrypted.password).toBeTruthy();
      expect(encrypted.username).not.toBe(encrypted.password);
    });
  });
});

// File: src/lib/validators.test.ts

import { describe, it, expect } from 'vitest';
import {
  isValidK8sName,
  isValidPEM,
  isSealedSecretScope,
} from './validators';

describe('validators', () => {
  describe('isValidK8sName', () => {
    it('should accept valid names', () => {
      expect(isValidK8sName('my-secret')).toBe(true);
      expect(isValidK8sName('secret-123')).toBe(true);
      expect(isValidK8sName('a')).toBe(true);
    });

    it('should reject invalid names', () => {
      expect(isValidK8sName('My-Secret')).toBe(false); // uppercase
      expect(isValidK8sName('-secret')).toBe(false); // starts with dash
      expect(isValidK8sName('secret-')).toBe(false); // ends with dash
      expect(isValidK8sName('secret_name')).toBe(false); // underscore
      expect(isValidK8sName('')).toBe(false); // empty
    });
  });

  describe('isSealedSecretScope', () => {
    it('should accept valid scopes', () => {
      expect(isSealedSecretScope('strict')).toBe(true);
      expect(isSealedSecretScope('namespace-wide')).toBe(true);
      expect(isSealedSecretScope('cluster-wide')).toBe(true);
    });

    it('should reject invalid scopes', () => {
      expect(isSealedSecretScope('invalid')).toBe(false);
      expect(isSealedSecretScope('')).toBe(false);
      expect(isSealedSecretScope(null)).toBe(false);
    });
  });
});

// File: src/hooks/useSealedSecretEncryption.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSealedSecretEncryption } from './useSealedSecretEncryption';

describe('useSealedSecretEncryption', () => {
  it('should encrypt successfully', async () => {
    const { result } = renderHook(() => useSealedSecretEncryption());

    const request = {
      name: 'my-secret',
      namespace: 'default',
      scope: 'strict' as const,
      keyValues: [{ key: 'password', value: 'secret123' }],
    };

    await waitFor(async () => {
      const encryptResult = await result.current.encrypt(request);
      expect(encryptResult.ok).toBe(true);
    });
  });
});
```

**Test Files to Create:**
- `src/lib/crypto.test.ts`
- `src/lib/validators.test.ts`
- `src/lib/controller.test.ts`
- `src/lib/rbac.test.ts`
- `src/hooks/useSealedSecretEncryption.test.ts`
- `src/hooks/usePermissions.test.ts`
- `src/test-utils/cert-generator.ts` (test helper)

**Testing Coverage Goals:**
- Core crypto: 90%+
- Validators: 100%
- Hooks: 80%+
- Controllers: 80%+

---

### 4.2 Component Tests
**Priority:** MEDIUM
**Effort:** 2 days
**Dependencies:** 4.1

**Implementation:**
```typescript
// File: src/components/EncryptDialog.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EncryptDialog } from './EncryptDialog';

describe('EncryptDialog', () => {
  it('should render dialog when open', () => {
    render(<EncryptDialog open={true} onClose={() => {}} />);

    expect(screen.getByText('Create Sealed Secret')).toBeInTheDocument();
    expect(screen.getByLabelText('Secret Name')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const onClose = vi.fn();
    render(<EncryptDialog open={true} onClose={onClose} />);

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('should add key-value pairs', async () => {
    render(<EncryptDialog open={true} onClose={() => {}} />);

    const addButton = screen.getByText('Add Another Key');
    fireEvent.click(addButton);

    const keyInputs = screen.getAllByLabelText(/Key Name/i);
    expect(keyInputs).toHaveLength(2);
  });

  it('should toggle password visibility', async () => {
    render(<EncryptDialog open={true} onClose={() => {}} />);

    const valueInput = screen.getByLabelText(/Secret Value/i);
    expect(valueInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByLabelText('Show password');
    fireEvent.click(toggleButton);

    expect(valueInput).toHaveAttribute('type', 'text');
  });
});
```

**Test Files to Create:**
- `src/components/EncryptDialog.test.tsx`
- `src/components/SealedSecretList.test.tsx`
- `src/components/SealedSecretDetail.test.tsx`
- `src/components/SettingsPage.test.tsx`

---

### 4.3 Integration Tests
**Priority:** MEDIUM
**Effort:** 2 days
**Dependencies:** 4.1, 4.2

**Implementation:**
```typescript
// File: src/__tests__/integration/encryption-flow.test.tsx

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupMockController } from '../../test-utils/mock-controller';

describe('Encryption Flow', () => {
  it('should complete full encryption workflow', async () => {
    setupMockController();

    // Render app
    render(<App />);

    // Navigate to Sealed Secrets
    const navLink = screen.getByText('Sealed Secrets');
    await userEvent.click(navLink);

    // Open create dialog
    const createButton = screen.getByText('Create Sealed Secret');
    await userEvent.click(createButton);

    // Fill form
    const nameInput = screen.getByLabelText('Secret Name');
    await userEvent.type(nameInput, 'my-test-secret');

    const keyInput = screen.getByLabelText(/Key Name/i);
    await userEvent.type(keyInput, 'password');

    const valueInput = screen.getByLabelText(/Secret Value/i);
    await userEvent.type(valueInput, 'secret123');

    // Submit
    const submitButton = screen.getByText('Create');
    await userEvent.click(submitButton);

    // Verify success
    await waitFor(() => {
      expect(screen.getByText('SealedSecret created successfully')).toBeInTheDocument();
    });
  });
});
```

---

### 4.4 Documentation Updates
**Priority:** HIGH
**Effort:** 2 days
**Dependencies:** All previous work

**Files to Create/Update:**

1. **API Documentation** (`docs/API.md`)
   - Document all public functions
   - Include usage examples
   - List all type definitions

2. **Architecture Guide** (`docs/ARCHITECTURE.md`)
   - Component hierarchy
   - Data flow diagrams
   - State management patterns
   - Security model

3. **Development Guide** (`docs/DEVELOPMENT.md`)
   - Setup instructions
   - Running tests
   - Building for production
   - Debugging tips

4. **User Guide** (`docs/USER_GUIDE.md`)
   - Installation steps
   - Feature walkthrough
   - Troubleshooting
   - FAQ

5. **Changelog** (`CHANGELOG.md`)
   - Document all enhancements
   - Migration guide for breaking changes
   - Version history

6. **Code Comments**
   - JSDoc for all exported functions
   - Inline comments for complex logic
   - README updates

---

## 📊 Implementation Timeline

### Week 1-2: Phase 1 - Foundation & Type Safety
- Day 1-2: Result types (1.1)
- Day 3: Branded types (1.2)
- Day 4: Type guards (1.3)
- Day 5: Generic utilities (1.4)
- Day 6-10: Code review, testing, adjustments

### Week 3-4: Phase 2 - Kubernetes Integration
- Day 1-2: Certificate validation (2.1)
- Day 3: Health checks (2.2)
- Day 4-5: RBAC (2.3)
- Day 6-7: API version detection (2.4)
- Day 8-10: Testing & documentation

### Week 5-6: Phase 3 - React Performance & UX
- Day 1-2: Custom hooks (3.1)
- Day 3-4: Form validation (3.2)
- Day 5: Performance optimization (3.3)
- Day 6: Error boundaries (3.4)
- Day 7: Loading states (3.5)
- Day 8-9: Accessibility (3.6)
- Day 10: Review & polish

### Week 7-8: Phase 4 - Testing & Documentation
- Day 1-3: Unit tests (4.1)
- Day 4-5: Component tests (4.2)
- Day 6-7: Integration tests (4.3)
- Day 8-10: Documentation (4.4)

---

## ✅ Success Criteria

### Phase 1
- [ ] All crypto operations use Result types
- [ ] Zero `any` types in production code
- [ ] Type coverage > 95%
- [ ] All validators have unit tests

### Phase 2
- [ ] Certificate expiry warnings functional
- [ ] Health check displays in UI
- [ ] RBAC-aware UI (hide unavailable actions)
- [ ] Multi-version API support

### Phase 3
- [ ] All dialogs use custom hooks
- [ ] Form validation with clear error messages
- [ ] Performance improvement measurable (< 100ms render)
- [ ] WCAG 2.1 AA compliance
- [ ] All loading states show skeletons

### Phase 4
- [ ] Test coverage > 80%
- [ ] All docs complete and reviewed
- [ ] No critical bugs
- [ ] Performance benchmarks documented

---

## 🔄 Rollout Strategy

### Phase 1 Release (v0.2.0)
- Type safety improvements
- Better error handling
- **Risk:** Low (internal changes)
- **Testing:** 1 week in staging

### Phase 2 Release (v0.3.0)
- Kubernetes enhancements
- RBAC support
- Certificate warnings
- **Risk:** Medium (new features)
- **Testing:** 2 weeks with multiple clusters

### Phase 3 Release (v0.4.0)
- UX improvements
- Performance optimizations
- Accessibility
- **Risk:** Low-Medium (UI changes)
- **Testing:** 1 week with user feedback

### Phase 4 Release (v1.0.0)
- Complete test coverage
- Full documentation
- Production ready
- **Risk:** Low (polish)
- **Testing:** 1 week final validation

---

## 🛠️ Development Tools & Setup

### Required Dependencies
```json
{
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

### Testing Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**'],
    },
  },
});
```

### CI/CD Integration
- Run tests on every PR
- Type checking with `tsc --noEmit`
- Lint with `eslint`
- Build verification
- Coverage reporting

---

## 📈 Metrics & Monitoring

### Key Performance Indicators

**Type Safety:**
- Type coverage percentage
- Number of `any` usages
- Number of type errors

**Code Quality:**
- Test coverage percentage
- Lines of code
- Cyclomatic complexity
- Code duplication

**Performance:**
- Time to interactive
- Component render time
- Bundle size
- Network requests

**User Experience:**
- Error rate
- Success rate (encryption/creation)
- Time to complete tasks
- Accessibility score

---

## 🎓 Training & Onboarding

### For Contributors
1. Read ARCHITECTURE.md
2. Review type system patterns
3. Understand Result type usage
4. Study custom hooks
5. Review testing strategy

### For Users
1. Read USER_GUIDE.md
2. Watch feature demos
3. Review troubleshooting guide
4. Join community discussions

---

## 🔮 Future Considerations (Post v1.0)

### Phase 5 (Future)
- Bulk operations (encrypt/rotate multiple secrets)
- Secret templates and presets
- Integration with external secret managers
- Audit logging
- Secret rotation scheduling
- GitOps integration (generate YAML for commits)
- CLI tool for CI/CD
- Backup & restore functionality

### Technical Debt
- Migrate to newer Headlamp plugin API (when available)
- Consider WebAssembly for crypto operations
- Evaluate migration to newer sealed-secrets API versions
- Progressive Web App (PWA) support

---

## 📞 Support & Resources

### Documentation
- README.md - Quick start
- ARCHITECTURE.md - Technical design
- API.md - API reference
- USER_GUIDE.md - End-user guide

### Community
- GitHub Issues - Bug reports
- GitHub Discussions - Questions
- Contributing Guide - How to contribute

---

**Document Version:** 1.0
**Last Updated:** 2026-02-11
**Next Review:** After Phase 1 completion

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>
