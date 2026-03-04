/**
 * Unit tests for controller API helpers
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkControllerHealth,
  fetchPublicCertificate,
  getPluginConfig,
  rotateSealedSecret,
  savePluginConfig,
} from './controller';

// Mock retry to avoid real delays
vi.mock('./retry', () => ({
  retryWithBackoff: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

describe('controller', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getPluginConfig / savePluginConfig', () => {
    it('should return default config when no stored config', () => {
      const config = getPluginConfig();
      expect(config.controllerName).toBe('sealed-secrets-controller');
      expect(config.controllerNamespace).toBe('kube-system');
      expect(config.controllerPort).toBe(8080);
    });

    it('should round-trip saved config', () => {
      const custom = {
        controllerName: 'my-controller',
        controllerNamespace: 'sealed-secrets',
        controllerPort: 9090,
      };
      savePluginConfig(custom);
      const loaded = getPluginConfig();
      expect(loaded).toEqual(custom);
    });

    it('should return default config on invalid JSON', () => {
      localStorage.setItem('sealed-secrets-plugin-config', 'not json');
      const config = getPluginConfig();
      expect(config.controllerName).toBe('sealed-secrets-controller');
    });

    it('should overwrite previous config', () => {
      savePluginConfig({
        controllerName: 'first',
        controllerNamespace: 'ns1',
        controllerPort: 1111,
      });
      savePluginConfig({
        controllerName: 'second',
        controllerNamespace: 'ns2',
        controllerPort: 2222,
      });
      const config = getPluginConfig();
      expect(config.controllerName).toBe('second');
    });
  });

  describe('fetchPublicCertificate', () => {
    it('should return certificate on success', async () => {
      const certPEM = '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(certPEM),
      });

      const config = getPluginConfig();
      const result = await fetchPublicCertificate(config);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(certPEM);
      }
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/v1/cert.pem'));
    });

    it('should return error on HTTP failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const config = getPluginConfig();
      const result = await fetchPublicCertificate(config);

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toContain('Unable to fetch controller certificate');
      }
    });

    it('should return error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const config = getPluginConfig();
      const result = await fetchPublicCertificate(config);

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toContain('Unable to fetch controller certificate');
      }
    });
  });

  describe('checkControllerHealth', () => {
    it('should return healthy status on 200', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'X-Controller-Version': '0.24.0' }),
      });

      const config = getPluginConfig();
      const result = await checkControllerHealth(config);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.healthy).toBe(true);
        expect(result.value.reachable).toBe(true);
        expect(result.value.version).toBe('0.24.0');
        expect(result.value.latencyMs).toBeDefined();
      }
    });

    it('should return unhealthy reachable on non-200', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
      });

      const config = getPluginConfig();
      const result = await checkControllerHealth(config);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.healthy).toBe(false);
        expect(result.value.reachable).toBe(true);
        expect(result.value.error).toContain('500');
      }
    });

    it('should return unreachable on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const config = getPluginConfig();
      const result = await checkControllerHealth(config);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.healthy).toBe(false);
        expect(result.value.reachable).toBe(false);
        expect(result.value.error).toBe('Connection refused');
      }
    });

    it('should handle timeout (AbortError)', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const config = getPluginConfig();
      const result = await checkControllerHealth(config);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.healthy).toBe(false);
        expect(result.value.reachable).toBe(false);
        expect(result.value.error).toContain('timed out');
      }
    });

    it('should return undefined version when header is absent', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
      });

      const config = getPluginConfig();
      const result = await checkControllerHealth(config);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBeUndefined();
      }
    });

    it('should use correct healthz endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
      });

      const config = {
        controllerName: 'my-ss',
        controllerNamespace: 'my-ns',
        controllerPort: 9090,
      };
      await checkControllerHealth(config);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/namespaces/my-ns/services/http:my-ss:9090/proxy/healthz',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('rotateSealedSecret', () => {
    it('should return rotated YAML on success', async () => {
      const rotatedYaml = '{"apiVersion":"bitnami.com/v1alpha1","kind":"SealedSecret"}';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(rotatedYaml),
      });

      const config = getPluginConfig();
      const result = await rotateSealedSecret(config, '{"old":"data"}');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(rotatedYaml);
      }
    });

    it('should return error on HTTP failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const config = getPluginConfig();
      const result = await rotateSealedSecret(config, '{"data":"test"}');

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toContain('Unable to rotate');
      }
    });

    it('should return error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'));

      const config = getPluginConfig();
      const result = await rotateSealedSecret(config, '{}');

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toContain('Unable to rotate');
      }
    });

    it('should POST to rotate endpoint with JSON content type', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('rotated'),
      });

      const config = getPluginConfig();
      const yaml = '{"test":"data"}';
      await rotateSealedSecret(config, yaml);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/rotate'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: yaml,
        })
      );
    });
  });
});
