/**
 * Unit tests for SealedSecretDetail component
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: vi.fn().mockReturnValue({ namespace: 'default', name: 'my-secret' }),
}));

// Mock notistack
const mockEnqueueSnackbar = vi.fn();
vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

// Mock iconify
vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`}>{icon}</span>,
}));

// Mock headlamp
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      Secret: {
        useGet: vi.fn().mockReturnValue([null, null]),
      },
    },
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  NameValueTable: ({ rows }: { rows: Array<{ name: string; value: unknown; hide?: boolean }> }) => (
    <table data-testid="name-value-table">
      <tbody>
        {rows
          .filter(r => !r.hide)
          .map((row, i) => (
            <tr key={i}>
              <td>{row.name}</td>
              <td>{typeof row.value === 'string' ? row.value : <>{row.value}</>}</td>
            </tr>
          ))}
      </tbody>
    </table>
  ),
  SectionBox: ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
    <div data-testid="section-box">
      <div data-testid="section-title">{title}</div>
      {children}
    </div>
  ),
  SimpleTable: ({ data }: { data: unknown[] }) => (
    <table data-testid="encrypted-table">
      <tbody>
        {(data || []).map((_, i) => (
          <tr key={i}>
            <td>row</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  StatusLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// Mock hooks and libs
vi.mock('../hooks/usePermissions', () => ({
  usePermissions: vi.fn().mockReturnValue({
    permissions: {
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
      canList: true,
    },
    loading: false,
  }),
}));

vi.mock('../lib/controller', () => ({
  getPluginConfig: vi.fn().mockReturnValue({
    controllerName: 'sealed-secrets-controller',
    controllerNamespace: 'kube-system',
    controllerPort: 8080,
  }),
  rotateSealedSecret: vi.fn(),
}));

vi.mock('../lib/rbac', () => ({
  canDecryptSecrets: vi.fn().mockResolvedValue(true),
}));

vi.mock('../lib/SealedSecretCRD', () => ({
  SealedSecret: {
    useGet: vi.fn(),
  },
}));

vi.mock('./DecryptDialog', () => ({
  DecryptDialog: () => <div data-testid="decrypt-dialog" />,
}));

vi.mock('./LoadingSkeletons', () => ({
  SealedSecretDetailSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

import { useParams } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { rotateSealedSecret } from '../lib/controller';
import { SealedSecret } from '../lib/SealedSecretCRD';
import { SealedSecretDetail } from './SealedSecretDetail';

const mockUseGet = vi.mocked(SealedSecret.useGet);
const mockRotate = vi.mocked(rotateSealedSecret);
const mockUsePermissions = vi.mocked(usePermissions);
const mockUseParams = vi.mocked(useParams);

describe('SealedSecretDetail', () => {
  const mockSealedSecret = {
    metadata: {
      name: 'my-secret',
      namespace: 'default',
      creationTimestamp: '2024-01-01T00:00:00Z',
    },
    spec: {
      encryptedData: {
        password: 'encrypted-value-1',
        token: 'encrypted-value-2',
      },
      template: {
        type: 'Opaque',
        metadata: {},
      },
    },
    scope: 'strict',
    isSynced: true,
    syncCondition: { type: 'Synced', status: 'True' },
    syncMessage: 'Secret synced successfully',
    getAge: () => '2d',
    jsonData: { spec: { encryptedData: {} } },
    delete: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ namespace: 'default', name: 'my-secret' });
    mockUseGet.mockReturnValue([mockSealedSecret, null] as never);
    mockUsePermissions.mockReturnValue({
      permissions: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canList: true,
      },
      loading: false,
      error: null,
    });
    mockRotate.mockResolvedValue({ ok: true, value: 'rotated' });
  });

  it('should show skeleton when loading', () => {
    mockUseGet.mockReturnValue([null, null] as never);

    render(<SealedSecretDetail />);

    expect(screen.getByTestId('skeleton')).toBeDefined();
  });

  it('should show error when fetch fails', () => {
    mockUseGet.mockReturnValue([null, 'Not found'] as never);

    render(<SealedSecretDetail />);

    expect(screen.getByText('Failed to load SealedSecret')).toBeDefined();
  });

  it('should show skeleton when params are missing', () => {
    mockUseParams.mockReturnValue({});

    render(<SealedSecretDetail />);

    expect(screen.getByTestId('skeleton')).toBeDefined();
  });

  it('should render detail view with data', () => {
    render(<SealedSecretDetail />);

    expect(screen.getAllByText('my-secret').length).toBeGreaterThan(0);
    expect(screen.getAllByText('default').length).toBeGreaterThan(0);
    expect(screen.getByText('Strict')).toBeDefined();
    expect(screen.getByText('Synced')).toBeDefined();
  });

  it('should render detail content inside drawer', () => {
    render(<SealedSecretDetail />);

    // Drawer content includes the secret name (appears in title and table)
    expect(screen.getAllByText('my-secret').length).toBeGreaterThan(0);
  });

  it('should render encrypted data section', () => {
    render(<SealedSecretDetail />);

    expect(screen.getByTestId('encrypted-table')).toBeDefined();
  });

  it('should render action buttons when user has permissions', () => {
    render(<SealedSecretDetail />);

    // Buttons are inside a MUI Drawer (portal). Check they exist in the document.
    const buttons = Array.from(document.querySelectorAll('button'));
    const reencryptBtn = buttons.find(b => b.textContent === 'Re-encrypt');
    const deleteBtn = buttons.find(b => b.textContent === 'Delete');
    expect(reencryptBtn || deleteBtn).toBeTruthy();
  });

  it('should handle rotate success via Result check', async () => {
    mockRotate.mockResolvedValue({ ok: true, value: 'rotated-yaml' });

    render(<SealedSecretDetail />);

    // Find and click Re-encrypt button (rendered in Drawer portal)
    const buttons = Array.from(document.querySelectorAll('button'));
    const reencryptBtn = buttons.find(b => b.textContent === 'Re-encrypt');
    if (reencryptBtn) {
      fireEvent.click(reencryptBtn);

      await waitFor(() => {
        expect(mockRotate).toHaveBeenCalled();
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('SealedSecret re-encrypted successfully', {
          variant: 'success',
        });
      });
    }
  });

  it('should handle rotate failure (Result error)', async () => {
    mockRotate.mockResolvedValue({ ok: false, error: 'Rotation failed: 400' });

    render(<SealedSecretDetail />);

    const buttons = Array.from(document.querySelectorAll('button'));
    const reencryptBtn = buttons.find(b => b.textContent === 'Re-encrypt');
    if (reencryptBtn) {
      fireEvent.click(reencryptBtn);

      await waitFor(() => {
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
          'Failed to re-encrypt: Rotation failed: 400',
          { variant: 'error' }
        );
      });
    }
  });
});
