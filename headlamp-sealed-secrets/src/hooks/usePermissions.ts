/**
 * React Hooks for RBAC Permission Checking
 *
 * Provides React hooks for checking and caching user permissions
 * for SealedSecrets and related resources.
 */

import React from 'react';
import { checkSealedSecretPermissions, ResourcePermissions } from '../lib/rbac';

/**
 * Hook to check SealedSecret permissions for a namespace
 *
 * Automatically fetches permissions on mount and when namespace changes.
 * Returns loading state and permissions.
 *
 * @param namespace Optional namespace to check (cluster-wide if omitted)
 * @returns Object with loading state, permissions, and error
 *
 * @example
 * const { loading, permissions, error } = usePermissions('default');
 * if (!loading && permissions?.canCreate) {
 *   // Show create button
 * }
 */
export function usePermissions(namespace?: string) {
  const [loading, setLoading] = React.useState(true);
  const [permissions, setPermissions] = React.useState<ResourcePermissions | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function fetchPermissions() {
      setLoading(true);
      setError(null);

      const result = await checkSealedSecretPermissions(namespace);

      if (!mounted) return;

      if (result.ok) {
        setPermissions(result.value);
        setError(null);
      } else if (result.ok === false) {
        setPermissions(null);
        setError(result.error);
      }

      setLoading(false);
    }

    fetchPermissions();

    return () => {
      mounted = false;
    };
  }, [namespace]);

  return { loading, permissions, error };
}

/**
 * Hook to check a specific permission
 *
 * Useful when you only need to check one permission (e.g., canCreate)
 * instead of fetching all permissions.
 *
 * @param namespace Optional namespace to check
 * @param permission Permission key to check
 * @returns Object with loading state and allowed flag
 *
 * @example
 * const { loading, allowed } = usePermission('default', 'canCreate');
 * if (allowed) {
 *   // Show create button
 * }
 */
export function usePermission(
  namespace: string | undefined,
  permission: keyof ResourcePermissions
) {
  const { loading, permissions } = usePermissions(namespace);
  const allowed = permissions?.[permission] ?? false;

  return { loading, allowed };
}

/**
 * Hook to check if user has any write permissions
 *
 * Returns true if user can create, update, or delete.
 * Useful for showing/hiding entire sections of UI.
 *
 * @param namespace Optional namespace to check
 * @returns Object with loading state and hasWriteAccess flag
 *
 * @example
 * const { loading, hasWriteAccess } = useHasWriteAccess('default');
 * if (hasWriteAccess) {
 *   // Show management UI
 * }
 */
export function useHasWriteAccess(namespace?: string) {
  const { loading, permissions } = usePermissions(namespace);

  const hasWriteAccess =
    permissions?.canCreate || permissions?.canUpdate || permissions?.canDelete || false;

  return { loading, hasWriteAccess };
}

/**
 * Hook to check if user has read-only access
 *
 * Returns true if user can read/list but cannot create/update/delete.
 *
 * @param namespace Optional namespace to check
 * @returns Object with loading state and isReadOnly flag
 *
 * @example
 * const { loading, isReadOnly } = useIsReadOnly('default');
 * if (isReadOnly) {
 *   // Show read-only warning
 * }
 */
export function useIsReadOnly(namespace?: string) {
  const { loading, permissions } = usePermissions(namespace);

  const isReadOnly =
    (permissions?.canRead || permissions?.canList) &&
    !permissions?.canCreate &&
    !permissions?.canUpdate &&
    !permissions?.canDelete;

  return { loading, isReadOnly };
}
