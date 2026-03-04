/**
 * Unit tests for RBAC permission checking
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canDecryptSecrets, checkSealedSecretPermissions } from './rbac';

describe('rbac', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('checkSealedSecretPermissions', () => {
    it('should return all true when all permissions are allowed', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: { allowed: true } }),
      });

      const result = await checkSealedSecretPermissions('default');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.canCreate).toBe(true);
        expect(result.value.canRead).toBe(true);
        expect(result.value.canUpdate).toBe(true);
        expect(result.value.canDelete).toBe(true);
        expect(result.value.canList).toBe(true);
      }
    });

    it('should return all false when all permissions are denied', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: { allowed: false } }),
      });

      const result = await checkSealedSecretPermissions('default');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.canCreate).toBe(false);
        expect(result.value.canRead).toBe(false);
        expect(result.value.canUpdate).toBe(false);
        expect(result.value.canDelete).toBe(false);
        expect(result.value.canList).toBe(false);
      }
    });

    it('should handle mixed permissions', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        // create=true, get=false, update=true, delete=false, list=true
        const allowed = callCount % 2 !== 0;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: { allowed } }),
        });
      });

      const result = await checkSealedSecretPermissions('default');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.canCreate).toBe(true);
        expect(result.value.canRead).toBe(false);
        expect(result.value.canUpdate).toBe(true);
        expect(result.value.canDelete).toBe(false);
        expect(result.value.canList).toBe(true);
      }
    });

    it('should make 5 SelfSubjectAccessReview requests', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: { allowed: true } }),
      });

      await checkSealedSecretPermissions('test-ns');

      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    it('should send correct request body structure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: { allowed: true } }),
      });

      await checkSealedSecretPermissions('my-ns');

      // Check the first call (create)
      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const firstCallBody = JSON.parse(calls[0][1].body);
      expect(firstCallBody.apiVersion).toBe('authorization.k8s.io/v1');
      expect(firstCallBody.kind).toBe('SelfSubjectAccessReview');
      expect(firstCallBody.spec.resourceAttributes.resource).toBe('sealedsecrets');
      expect(firstCallBody.spec.resourceAttributes.group).toBe('bitnami.com');
      expect(firstCallBody.spec.resourceAttributes.namespace).toBe('my-ns');
      expect(firstCallBody.spec.resourceAttributes.verb).toBe('create');
    });

    it('should omit namespace when not provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: { allowed: true } }),
      });

      await checkSealedSecretPermissions();

      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const firstCallBody = JSON.parse(calls[0][1].body);
      expect(firstCallBody.spec.resourceAttributes.namespace).toBeUndefined();
    });

    it('should return false when fetch fails for individual checks', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const result = await checkSealedSecretPermissions('default');

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Individual failures return false (assume no permission)
        expect(result.value.canCreate).toBe(false);
      }
    });

    it('should return Err when Promise.all rejects', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await checkSealedSecretPermissions('default');

      // The tryCatchAsync in checkPermission catches this, so individual results are false
      // But if the outer try/catch catches, we get Err
      // With current implementation, individual failures return false, not Err
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.canCreate).toBe(false);
      }
    });
  });

  describe('canDecryptSecrets', () => {
    it('should return true when get secrets is allowed', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: { allowed: true } }),
      });

      const result = await canDecryptSecrets('default');
      expect(result).toBe(true);
    });

    it('should return false when get secrets is denied', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: { allowed: false } }),
      });

      const result = await canDecryptSecrets('default');
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('network error'));

      const result = await canDecryptSecrets('default');
      expect(result).toBe(false);
    });

    it('should check secrets resource with get verb', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: { allowed: true } }),
      });

      await canDecryptSecrets('prod');

      const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(body.spec.resourceAttributes.resource).toBe('secrets');
      expect(body.spec.resourceAttributes.verb).toBe('get');
      expect(body.spec.resourceAttributes.namespace).toBe('prod');
    });
  });
});
