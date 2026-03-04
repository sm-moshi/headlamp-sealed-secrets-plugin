/**
 * Unit tests for VersionWarning component
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock SealedSecretCRD
vi.mock('../lib/SealedSecretCRD', () => ({
  SealedSecret: {
    detectApiVersion: vi.fn(),
    DEFAULT_VERSION: 'bitnami.com/v1alpha1',
  },
}));

import { SealedSecret } from '../lib/SealedSecretCRD';
import { VersionWarning } from './VersionWarning';

const mockDetectVersion = vi.mocked(SealedSecret.detectApiVersion);

describe('VersionWarning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show nothing while loading', () => {
    mockDetectVersion.mockReturnValue(new Promise(() => {}));

    const { container } = render(<VersionWarning autoDetect />);

    expect(container.innerHTML).toBe('');
  });

  it('should show nothing on default version detection', async () => {
    mockDetectVersion.mockResolvedValue({
      ok: true,
      value: 'bitnami.com/v1alpha1',
    });

    const { container } = render(<VersionWarning autoDetect />);

    await waitFor(() => {
      // Should render null for default version without showDetails
      expect(container.innerHTML).toBe('');
    });
  });

  it('should show info alert for non-default version', async () => {
    mockDetectVersion.mockResolvedValue({
      ok: true,
      value: 'bitnami.com/v1alpha2',
    });

    render(<VersionWarning autoDetect />);

    await waitFor(() => {
      expect(screen.getByText('API Version Detected')).toBeDefined();
    });

    expect(screen.getByText('bitnami.com/v1alpha2')).toBeDefined();
  });

  it('should show error with retry button on detection failure', async () => {
    mockDetectVersion.mockResolvedValue({
      ok: false,
      error: 'CRD not found',
    });

    render(<VersionWarning autoDetect />);

    await waitFor(() => {
      expect(screen.getByText('API Version Detection Failed')).toBeDefined();
    });

    expect(screen.getByText(/CRD not found/)).toBeDefined();
    expect(screen.getByText('Retry')).toBeDefined();
  });

  it('should retry on button click', async () => {
    mockDetectVersion
      .mockResolvedValueOnce({ ok: false, error: 'error' })
      .mockResolvedValueOnce({ ok: true, value: 'bitnami.com/v1alpha1' });

    render(<VersionWarning autoDetect />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(mockDetectVersion).toHaveBeenCalledTimes(2);
    });
  });

  it('should show installation hint when CRD not found', async () => {
    mockDetectVersion.mockResolvedValue({
      ok: false,
      error: 'CRD not found',
    });

    render(<VersionWarning autoDetect />);

    await waitFor(() => {
      expect(screen.getByText(/kubectl apply/)).toBeDefined();
    });
  });

  it('should show success alert when showDetails is true and default version detected', async () => {
    mockDetectVersion.mockResolvedValue({
      ok: true,
      value: 'bitnami.com/v1alpha1',
    });

    render(<VersionWarning autoDetect showDetails />);

    await waitFor(() => {
      expect(screen.getByText('API Version Detected')).toBeDefined();
      expect(screen.getByText('bitnami.com/v1alpha1')).toBeDefined();
    });
  });

  it('should not auto-detect when autoDetect is false', () => {
    render(<VersionWarning autoDetect={false} />);

    expect(mockDetectVersion).not.toHaveBeenCalled();
  });

  it('should handle unexpected exceptions', async () => {
    mockDetectVersion.mockRejectedValue(new Error('Unexpected'));

    render(<VersionWarning autoDetect />);

    await waitFor(() => {
      expect(screen.getByText('API Version Detection Failed')).toBeDefined();
      expect(screen.getByText(/Unexpected/)).toBeDefined();
    });
  });
});
