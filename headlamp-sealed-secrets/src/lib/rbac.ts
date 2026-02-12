/**
 * RBAC Permission Checking
 *
 * Utilities for checking user permissions for SealedSecrets and related
 * Kubernetes resources using SelfSubjectAccessReview API.
 */

import { AsyncResult, Err, Ok, tryCatchAsync } from '../types';

/**
 * Resource permissions for a specific resource type
 */
export interface ResourcePermissions {
  /** Can create new resources */
  canCreate: boolean;
  /** Can read/get individual resources */
  canRead: boolean;
  /** Can update/patch existing resources */
  canUpdate: boolean;
  /** Can delete resources */
  canDelete: boolean;
  /** Can list resources */
  canList: boolean;
}

/**
 * Check user permissions for SealedSecrets in a namespace
 *
 * Uses Kubernetes SelfSubjectAccessReview API to verify what the current
 * user is allowed to do with SealedSecret resources.
 *
 * @param namespace Optional namespace to check (cluster-wide if omitted)
 * @returns Result containing permission flags or error message
 */
export async function checkSealedSecretPermissions(
  namespace?: string
): AsyncResult<ResourcePermissions, string> {
  try {
    const [canCreate, canRead, canUpdate, canDelete, canList] = await Promise.all([
      checkPermission('create', 'sealedsecrets', 'bitnami.com', namespace),
      checkPermission('get', 'sealedsecrets', 'bitnami.com', namespace),
      checkPermission('update', 'sealedsecrets', 'bitnami.com', namespace),
      checkPermission('delete', 'sealedsecrets', 'bitnami.com', namespace),
      checkPermission('list', 'sealedsecrets', 'bitnami.com', namespace),
    ]);

    return Ok({
      canCreate,
      canRead,
      canUpdate,
      canDelete,
      canList,
    });
  } catch (error: any) {
    return Err(`Failed to check SealedSecret permissions: ${error.message}`);
  }
}

/**
 * Check if user can decrypt secrets (requires get permission on Secrets)
 *
 * @param namespace Namespace to check Secret permissions in
 * @returns true if user has permission to get Secrets
 */
export async function canDecryptSecrets(namespace: string): Promise<boolean> {
  try {
    return await checkPermission('get', 'secrets', '', namespace);
  } catch {
    return false;
  }
}

/**
 * Check if user can view sealing keys (requires get permission on Secrets in controller namespace)
 *
 * @param controllerNamespace Namespace where sealed-secrets controller is running
 * @returns true if user has permission to get Secrets in controller namespace
 */
export async function canViewSealingKeys(controllerNamespace: string): Promise<boolean> {
  try {
    return await checkPermission('get', 'secrets', '', controllerNamespace);
  } catch {
    return false;
  }
}

/**
 * Check a specific permission using SelfSubjectAccessReview
 *
 * @param verb Kubernetes verb (create, get, update, delete, list, etc.)
 * @param resource Resource type (sealedsecrets, secrets, etc.)
 * @param group API group (bitnami.com for SealedSecrets, empty for core resources)
 * @param namespace Optional namespace (cluster-wide if omitted)
 * @returns true if user has permission, false otherwise
 */
async function checkPermission(
  verb: string,
  resource: string,
  group: string,
  namespace?: string
): Promise<boolean> {
  const result = await tryCatchAsync(async () => {
    const reviewRequest = {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          ...(group && { group }),
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
      throw new Error(`RBAC check failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.status?.allowed === true;
  });

  // Return false on error (assume no permission)
  return result.ok ? result.value : false;
}

/**
 * Check permissions for multiple namespaces
 *
 * Useful for multi-namespace views to determine which namespaces the user
 * can interact with.
 *
 * @param namespaces Array of namespace names to check
 * @returns Map of namespace to permissions
 */
export async function checkMultiNamespacePermissions(
  namespaces: string[]
): AsyncResult<Record<string, ResourcePermissions>, string> {
  try {
    const results = await Promise.all(
      namespaces.map(async ns => {
        const perms = await checkSealedSecretPermissions(ns);
        return { namespace: ns, permissions: perms };
      })
    );

    const permissionsMap: Record<string, ResourcePermissions> = {};
    for (const { namespace, permissions } of results) {
      if (permissions.ok) {
        permissionsMap[namespace] = permissions.value;
      }
    }

    return Ok(permissionsMap);
  } catch (error: any) {
    return Err(`Failed to check multi-namespace permissions: ${error.message}`);
  }
}
