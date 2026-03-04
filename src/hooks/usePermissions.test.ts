/**
 * Unit tests for usePermissions hooks
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock rbac module
vi.mock('../lib/rbac', () => ({
  checkSealedSecretPermissions: vi.fn(),
}));

import { checkSealedSecretPermissions } from '../lib/rbac';
import { usePermission, usePermissions } from './usePermissions';

const mockCheckPerms = vi.mocked(checkSealedSecretPermissions);

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usePermissions', () => {
    it('should start in loading state', () => {
      mockCheckPerms.mockReturnValue(new Promise(() => {})); // never resolves

      const { result } = renderHook(() => usePermissions('default'));

      expect(result.current.loading).toBe(true);
      expect(result.current.permissions).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should transition to loaded with permissions', async () => {
      mockCheckPerms.mockResolvedValue({
        ok: true,
        value: {
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canList: true,
        },
      });

      const { result } = renderHook(() => usePermissions('default'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions).toEqual({
        canCreate: true,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canList: true,
      });
      expect(result.current.error).toBe(null);
    });

    it('should set error state on failure', async () => {
      mockCheckPerms.mockResolvedValue({
        ok: false,
        error: 'Permission check failed',
      });

      const { result } = renderHook(() => usePermissions('default'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions).toBe(null);
      expect(result.current.error).toBe('Permission check failed');
    });

    it('should re-fetch when namespace changes', async () => {
      mockCheckPerms.mockResolvedValue({
        ok: true,
        value: {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canList: true,
        },
      });

      const { result, rerender } = renderHook(({ ns }: { ns: string }) => usePermissions(ns), {
        initialProps: { ns: 'default' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCheckPerms).toHaveBeenCalledWith('default');

      rerender({ ns: 'production' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCheckPerms).toHaveBeenCalledWith('production');
      expect(mockCheckPerms).toHaveBeenCalledTimes(2);
    });

    it('should handle unmount cancellation', async () => {
      let resolvePromise: (value: unknown) => void;
      mockCheckPerms.mockReturnValue(
        new Promise(resolve => {
          resolvePromise = resolve;
        })
      );

      const { result, unmount } = renderHook(() => usePermissions('default'));

      expect(result.current.loading).toBe(true);

      // Unmount before promise resolves
      unmount();

      // Resolve after unmount - should not cause errors
      resolvePromise!({
        ok: true,
        value: {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canList: true,
        },
      });
    });

    it('should work without namespace (cluster-wide)', async () => {
      mockCheckPerms.mockResolvedValue({
        ok: true,
        value: {
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canList: true,
        },
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCheckPerms).toHaveBeenCalledWith(undefined);
    });
  });

  describe('usePermission', () => {
    it('should return specific permission', async () => {
      mockCheckPerms.mockResolvedValue({
        ok: true,
        value: {
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canList: true,
        },
      });

      const { result } = renderHook(() => usePermission('default', 'canCreate'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.allowed).toBe(true);
    });

    it('should return false when permission is denied', async () => {
      mockCheckPerms.mockResolvedValue({
        ok: true,
        value: {
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canList: true,
        },
      });

      const { result } = renderHook(() => usePermission('default', 'canCreate'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.allowed).toBe(false);
    });

    it('should return false when permissions are null (loading/error)', () => {
      mockCheckPerms.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => usePermission('default', 'canCreate'));

      expect(result.current.loading).toBe(true);
      expect(result.current.allowed).toBe(false);
    });
  });
});
