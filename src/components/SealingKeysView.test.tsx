/**
 * Unit tests for SealingKeysView component
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock useNotification (replaces notistack)
const mockEnqueueSnackbar = vi.fn();
vi.mock('../hooks/useNotification', () => ({
  useNotification: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

// Mock headlamp
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      Secret: {
        useList: vi.fn(),
      },
    },
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: ({
    title,
    children,
    headerProps,
  }: {
    title: string;
    children: React.ReactNode;
    headerProps?: { actions?: React.ReactNode[] };
  }) => (
    <div data-testid="section-box">
      <h2>{title}</h2>
      <div data-testid="header-actions">
        {headerProps?.actions?.map((action, i) => (
          <div key={i}>{action}</div>
        ))}
      </div>
      {children}
    </div>
  ),
  SimpleTable: ({
    data,
    columns,
  }: {
    data: unknown[];
    columns: Array<{ label: string; getter: (row: unknown) => React.ReactNode }>;
  }) => (
    <table data-testid="keys-table">
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map((col, j) => (
              <td key={j}>{col.getter(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  StatusLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
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
  parseCertificateInfo: vi.fn().mockReturnValue({ ok: false, error: 'no cert' }),
  isCertificateExpiringSoon: vi.fn().mockReturnValue(false),
}));

vi.mock('./ControllerStatus', () => ({
  ControllerStatus: () => <div data-testid="controller-status">Status</div>,
}));

vi.mock('./LoadingSkeletons', () => ({
  SealingKeysListSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { fetchPublicCertificate } from '../lib/controller';
import { SealingKeysView } from './SealingKeysView';

const mockUseList = vi.mocked(K8s.ResourceClasses.Secret.useList);
const mockFetchCert = vi.mocked(fetchPublicCertificate);

describe('SealingKeysView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading skeleton', () => {
    mockUseList.mockReturnValue([null, null, true] as never);

    render(<SealingKeysView />);

    expect(screen.getByTestId('skeleton')).toBeDefined();
  });

  it('should show empty message when no sealing keys found', () => {
    mockUseList.mockReturnValue([[], null, false] as never);

    render(<SealingKeysView />);

    expect(screen.getByText(/No sealing keys found/)).toBeDefined();
  });

  it('should render sealing keys table', () => {
    const secrets = [
      {
        metadata: {
          name: 'sealed-secrets-key-abc',
          labels: { 'sealedsecrets.bitnami.com/sealed-secrets-key': 'active' },
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        data: {},
      },
      {
        metadata: {
          name: 'sealed-secrets-key-old',
          labels: { 'sealedsecrets.bitnami.com/sealed-secrets-key': 'compromised' },
          creationTimestamp: '2023-06-01T00:00:00Z',
        },
        data: {},
      },
    ];
    mockUseList.mockReturnValue([secrets, null, false] as never);

    render(<SealingKeysView />);

    expect(screen.getByTestId('keys-table')).toBeDefined();
    expect(screen.getByText('sealed-secrets-key-abc')).toBeDefined();
    expect(screen.getByText('sealed-secrets-key-old')).toBeDefined();
  });

  it('should filter non-sealing-key secrets', () => {
    const secrets = [
      {
        metadata: {
          name: 'sealing-key',
          labels: { 'sealedsecrets.bitnami.com/sealed-secrets-key': 'active' },
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        data: {},
      },
      {
        metadata: {
          name: 'other-secret',
          labels: {},
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        data: {},
      },
    ];
    mockUseList.mockReturnValue([secrets, null, false] as never);

    render(<SealingKeysView />);

    expect(screen.getByText('sealing-key')).toBeDefined();
    expect(screen.queryByText('other-secret')).toBeNull();
  });

  it('should sort active keys before compromised', () => {
    const secrets = [
      {
        metadata: {
          name: 'compromised-key',
          labels: { 'sealedsecrets.bitnami.com/sealed-secrets-key': 'compromised' },
          creationTimestamp: '2024-06-01T00:00:00Z',
        },
        data: {},
      },
      {
        metadata: {
          name: 'active-key',
          labels: { 'sealedsecrets.bitnami.com/sealed-secrets-key': 'active' },
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        data: {},
      },
    ];
    mockUseList.mockReturnValue([secrets, null, false] as never);

    render(<SealingKeysView />);

    const rows = screen.getAllByRole('row');
    // First data row should be active key (after header row)
    expect(rows[1].textContent).toContain('active-key');
  });

  it('should show download certificate button', () => {
    mockUseList.mockReturnValue([[], null, false] as never);

    render(<SealingKeysView />);

    expect(screen.getByText('Download Public Certificate')).toBeDefined();
  });

  it('should handle certificate download failure', async () => {
    mockUseList.mockReturnValue([[], null, false] as never);
    mockFetchCert.mockResolvedValue({ ok: false, error: 'Network error' });

    render(<SealingKeysView />);

    fireEvent.click(screen.getByText('Download Public Certificate'));

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        expect.stringContaining('Failed to download certificate'),
        { variant: 'error' }
      );
    });
  });

  it('should call fetchPublicCertificate on download click', async () => {
    mockUseList.mockReturnValue([[], null, false] as never);
    mockFetchCert.mockResolvedValue({ ok: true, value: 'cert-pem' as never });

    // Mock Blob/URL to prevent DOM issues
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
    global.URL.revokeObjectURL = vi.fn();

    render(<SealingKeysView />);

    fireEvent.click(screen.getByText('Download Public Certificate'));

    await waitFor(() => {
      expect(mockFetchCert).toHaveBeenCalled();
    });
  });

  it('should show ControllerStatus in header', () => {
    mockUseList.mockReturnValue([[], null, false] as never);

    render(<SealingKeysView />);

    expect(screen.getByTestId('controller-status')).toBeDefined();
  });
});
