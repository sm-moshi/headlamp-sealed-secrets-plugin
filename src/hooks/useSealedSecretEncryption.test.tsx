/**
 * Unit tests for useSealedSecretEncryption hook
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
const mockEnqueueSnackbar = vi.fn();
vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../lib/controller', () => ({
  getPluginConfig: vi.fn().mockReturnValue({
    controllerName: 'sealed-secrets-controller',
    controllerNamespace: 'kube-system',
    controllerPort: 8080,
  }),
  fetchPublicCertificate: vi.fn(),
}));

vi.mock('../lib/crypto', () => ({
  parsePublicKeyFromCert: vi.fn(),
  encryptKeyValues: vi.fn(),
  parseCertificateInfo: vi.fn(),
  isCertificateExpiringSoon: vi.fn(),
}));

vi.mock('../lib/validators', () => ({
  validateSecretName: vi.fn().mockReturnValue({ valid: true }),
  validateSecretKey: vi.fn().mockReturnValue({ valid: true }),
  validateSecretValue: vi.fn().mockReturnValue({ valid: true }),
}));

import { fetchPublicCertificate } from '../lib/controller';
import {
  encryptKeyValues,
  isCertificateExpiringSoon,
  parseCertificateInfo,
  parsePublicKeyFromCert,
} from '../lib/crypto';
import { validateSecretKey, validateSecretName, validateSecretValue } from '../lib/validators';
import { useSealedSecretEncryption } from './useSealedSecretEncryption';

const mockFetchCert = vi.mocked(fetchPublicCertificate);
const mockParseKey = vi.mocked(parsePublicKeyFromCert);
const mockEncryptKV = vi.mocked(encryptKeyValues);
const mockParseCertInfo = vi.mocked(parseCertificateInfo);
const mockIsExpiringSoon = vi.mocked(isCertificateExpiringSoon);
const mockValidateName = vi.mocked(validateSecretName);
const mockValidateKey = vi.mocked(validateSecretKey);
const mockValidateValue = vi.mocked(validateSecretValue);

describe('useSealedSecretEncryption', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default happy path mocks
    mockFetchCert.mockResolvedValue({ ok: true, value: 'fake-cert' as never });
    mockParseKey.mockReturnValue({ ok: true, value: {} as never });
    mockEncryptKV.mockReturnValue({
      ok: true,
      value: { password: 'encrypted' } as never,
    });
    mockParseCertInfo.mockReturnValue({
      ok: true,
      value: {
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 86400000),
        isExpired: false,
        daysUntilExpiry: 365,
        issuer: 'CN=test',
        subject: 'CN=test',
        fingerprint: 'abc',
        serialNumber: '01',
      },
    });
    mockIsExpiringSoon.mockReturnValue(false);
    mockValidateName.mockReturnValue({ valid: true });
    mockValidateKey.mockReturnValue({ valid: true });
    mockValidateValue.mockReturnValue({ valid: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with encrypting = false', () => {
    const { result } = renderHook(() => useSealedSecretEncryption());
    expect(result.current.encrypting).toBe(false);
  });

  it('should return error when name validation fails', async () => {
    mockValidateName.mockReturnValue({ valid: false, error: 'Name is required' });

    const { result } = renderHook(() => useSealedSecretEncryption());

    let encryptResult: unknown;
    await act(async () => {
      encryptResult = await result.current.encrypt({
        name: '',
        namespace: 'default',
        scope: 'strict',
        keyValues: [{ key: 'k', value: 'v' }],
      });
    });

    expect((encryptResult as { ok: boolean }).ok).toBe(false);
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Name is required', { variant: 'error' });
  });

  it('should return error when key validation fails', async () => {
    mockValidateKey.mockReturnValue({ valid: false, error: 'Key name is required' });

    const { result } = renderHook(() => useSealedSecretEncryption());

    let encryptResult: unknown;
    await act(async () => {
      encryptResult = await result.current.encrypt({
        name: 'my-secret',
        namespace: 'default',
        scope: 'strict',
        keyValues: [{ key: '', value: 'v' }],
      });
    });

    expect((encryptResult as { ok: boolean }).ok).toBe(false);
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      expect.stringContaining('Key name is required'),
      { variant: 'error' }
    );
  });

  it('should return error when value validation fails', async () => {
    mockValidateValue.mockReturnValue({ valid: false, error: 'Value is required' });

    const { result } = renderHook(() => useSealedSecretEncryption());

    let encryptResult: unknown;
    await act(async () => {
      encryptResult = await result.current.encrypt({
        name: 'my-secret',
        namespace: 'default',
        scope: 'strict',
        keyValues: [{ key: 'pass', value: '' }],
      });
    });

    expect((encryptResult as { ok: boolean }).ok).toBe(false);
  });

  it('should return error for empty keyValues', async () => {
    const { result } = renderHook(() => useSealedSecretEncryption());

    let encryptResult: unknown;
    await act(async () => {
      encryptResult = await result.current.encrypt({
        name: 'my-secret',
        namespace: 'default',
        scope: 'strict',
        keyValues: [],
      });
    });

    expect((encryptResult as { ok: boolean }).ok).toBe(false);
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('At least one key-value pair is required', {
      variant: 'error',
    });
  });

  it('should return error when certificate fetch fails', async () => {
    mockFetchCert.mockResolvedValue({ ok: false, error: 'Controller unreachable' });

    const { result } = renderHook(() => useSealedSecretEncryption());

    let encryptResult: unknown;
    await act(async () => {
      encryptResult = await result.current.encrypt({
        name: 'my-secret',
        namespace: 'default',
        scope: 'strict',
        keyValues: [{ key: 'k', value: 'v' }],
      });
    });

    expect((encryptResult as { ok: boolean }).ok).toBe(false);
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      expect.stringContaining('Failed to fetch certificate'),
      { variant: 'error' }
    );
  });

  it('should warn when certificate is expired', async () => {
    mockParseCertInfo.mockReturnValue({
      ok: true,
      value: {
        validFrom: new Date('2020-01-01'),
        validTo: new Date('2021-01-01'),
        isExpired: true,
        daysUntilExpiry: -500,
        issuer: 'CN=test',
        subject: 'CN=test',
        fingerprint: 'abc',
        serialNumber: '01',
      },
    });

    const { result } = renderHook(() => useSealedSecretEncryption());

    await act(async () => {
      await result.current.encrypt({
        name: 'my-secret',
        namespace: 'default',
        scope: 'strict',
        keyValues: [{ key: 'k', value: 'v' }],
      });
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(expect.stringContaining('expired'), {
      variant: 'warning',
    });
  });

  it('should warn when certificate is expiring soon', async () => {
    mockIsExpiringSoon.mockReturnValue(true);
    mockParseCertInfo.mockReturnValue({
      ok: true,
      value: {
        validFrom: new Date(),
        validTo: new Date(Date.now() + 10 * 86400000),
        isExpired: false,
        daysUntilExpiry: 10,
        issuer: 'CN=test',
        subject: 'CN=test',
        fingerprint: 'abc',
        serialNumber: '01',
      },
    });

    const { result } = renderHook(() => useSealedSecretEncryption());

    await act(async () => {
      await result.current.encrypt({
        name: 'my-secret',
        namespace: 'default',
        scope: 'strict',
        keyValues: [{ key: 'k', value: 'v' }],
      });
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(expect.stringContaining('expires in'), {
      variant: 'warning',
    });
  });

  it('should return error when public key parsing fails', async () => {
    mockParseKey.mockReturnValue({ ok: false, error: 'Invalid cert' });

    const { result } = renderHook(() => useSealedSecretEncryption());

    let encryptResult: unknown;
    await act(async () => {
      encryptResult = await result.current.encrypt({
        name: 'my-secret',
        namespace: 'default',
        scope: 'strict',
        keyValues: [{ key: 'k', value: 'v' }],
      });
    });

    expect((encryptResult as { ok: boolean }).ok).toBe(false);
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      expect.stringContaining('Invalid certificate'),
      { variant: 'error' }
    );
  });

  it('should return error when encryption fails', async () => {
    mockEncryptKV.mockReturnValue({ ok: false, error: 'Encryption failed' });

    const { result } = renderHook(() => useSealedSecretEncryption());

    let encryptResult: unknown;
    await act(async () => {
      encryptResult = await result.current.encrypt({
        name: 'my-secret',
        namespace: 'default',
        scope: 'strict',
        keyValues: [{ key: 'k', value: 'v' }],
      });
    });

    expect((encryptResult as { ok: boolean }).ok).toBe(false);
  });

  it('should return SealedSecret data on success', async () => {
    const { result } = renderHook(() => useSealedSecretEncryption());

    let encryptResult: { ok: boolean; value?: { sealedSecretData: unknown } };
    await act(async () => {
      encryptResult = await result.current.encrypt({
        name: 'my-secret',
        namespace: 'default',
        scope: 'strict',
        keyValues: [{ key: 'password', value: 'secret' }],
      });
    });

    expect(encryptResult!.ok).toBe(true);
    if (encryptResult!.ok) {
      const data = encryptResult!.value!.sealedSecretData as Record<string, unknown>;
      expect(data.apiVersion).toBe('bitnami.com/v1alpha1');
      expect(data.kind).toBe('SealedSecret');
      expect((data.metadata as Record<string, unknown>).name).toBe('my-secret');
      expect((data.metadata as Record<string, unknown>).namespace).toBe('default');
    }
  });

  it('should add namespace-wide scope annotation', async () => {
    const { result } = renderHook(() => useSealedSecretEncryption());

    let encryptResult: {
      ok: boolean;
      value?: { sealedSecretData: { metadata: { annotations: Record<string, string> } } };
    };
    await act(async () => {
      encryptResult = await result.current.encrypt({
        name: 'my-secret',
        namespace: 'default',
        scope: 'namespace-wide',
        keyValues: [{ key: 'k', value: 'v' }],
      });
    });

    expect(encryptResult!.ok).toBe(true);
    if (encryptResult!.ok) {
      expect(
        encryptResult!.value!.sealedSecretData.metadata.annotations[
          'sealedsecrets.bitnami.com/namespace-wide'
        ]
      ).toBe('true');
    }
  });

  it('should add cluster-wide scope annotation', async () => {
    const { result } = renderHook(() => useSealedSecretEncryption());

    let encryptResult: {
      ok: boolean;
      value?: { sealedSecretData: { metadata: { annotations: Record<string, string> } } };
    };
    await act(async () => {
      encryptResult = await result.current.encrypt({
        name: 'my-secret',
        namespace: 'default',
        scope: 'cluster-wide',
        keyValues: [{ key: 'k', value: 'v' }],
      });
    });

    expect(encryptResult!.ok).toBe(true);
    if (encryptResult!.ok) {
      expect(
        encryptResult!.value!.sealedSecretData.metadata.annotations[
          'sealedsecrets.bitnami.com/cluster-wide'
        ]
      ).toBe('true');
    }
  });

  it('should set encrypting state during encryption', async () => {
    let resolveEncrypt: (value: unknown) => void;
    mockFetchCert.mockReturnValue(
      new Promise(resolve => {
        resolveEncrypt = resolve;
      })
    );

    const { result } = renderHook(() => useSealedSecretEncryption());

    let encryptPromise: Promise<unknown>;
    act(() => {
      encryptPromise = result.current.encrypt({
        name: 'my-secret',
        namespace: 'default',
        scope: 'strict',
        keyValues: [{ key: 'k', value: 'v' }],
      });
    });

    // Should be encrypting
    expect(result.current.encrypting).toBe(true);

    // Resolve the cert fetch
    await act(async () => {
      resolveEncrypt!({ ok: true, value: 'cert' });
      await encryptPromise;
    });

    expect(result.current.encrypting).toBe(false);
  });
});
