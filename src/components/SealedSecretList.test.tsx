/**
 * Unit tests for SealedSecretList component
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: vi.fn().mockReturnValue({}),
}));

// Mock headlamp
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  SectionBox: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="section-box">
      <h2>{title}</h2>
      {children}
    </div>
  ),
  SectionFilterHeader: ({ actions }: { actions?: React.ReactNode[] }) => (
    <div data-testid="filter-header">
      {actions?.map((action, i) => (
        <div key={i}>{action}</div>
      ))}
    </div>
  ),
  SimpleTable: ({ data }: { data: unknown[] }) => (
    <table data-testid="simple-table">
      <tbody>
        {(data || []).map((_, i) => (
          <tr key={i}>
            <td>row {i}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  StatusLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// Mock SealedSecretCRD
vi.mock('../lib/SealedSecretCRD', () => ({
  SealedSecret: {
    useList: vi.fn(),
  },
}));

// Mock hooks
vi.mock('../hooks/usePermissions', () => ({
  usePermission: vi.fn().mockReturnValue({ loading: false, allowed: true }),
}));

// Mock sub-components
vi.mock('./EncryptDialog', () => ({
  EncryptDialog: () => <div data-testid="encrypt-dialog" />,
}));

vi.mock('./LoadingSkeletons', () => ({
  SealedSecretListSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

vi.mock('./SealedSecretDetail', () => ({
  SealedSecretDetail: () => <div data-testid="detail" />,
}));

vi.mock('./VersionWarning', () => ({
  VersionWarning: () => <div data-testid="version-warning" />,
}));

import { usePermission } from '../hooks/usePermissions';
import { SealedSecret } from '../lib/SealedSecretCRD';
import { SealedSecretList } from './SealedSecretList';

const mockUseList = vi.mocked(SealedSecret.useList);
const mockUsePermission = vi.mocked(usePermission);

describe('SealedSecretList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue({ loading: false, allowed: true });
  });

  it('should show loading skeleton', () => {
    mockUseList.mockReturnValue([null, null, true] as never);

    render(<SealedSecretList />);

    expect(screen.getByTestId('skeleton')).toBeDefined();
  });

  it('should show error when fetch fails', () => {
    mockUseList.mockReturnValue([null, { message: 'Failed to fetch' }, false] as never);

    render(<SealedSecretList />);

    expect(screen.getByText(/Failed to load Sealed Secrets/)).toBeDefined();
  });

  it('should show 404 hint when CRD not found', () => {
    mockUseList.mockReturnValue([null, { message: '404 Not Found' }, false] as never);

    render(<SealedSecretList />);

    expect(screen.getByText(/CRD not found/)).toBeDefined();
    expect(screen.getByText(/kubectl apply/)).toBeDefined();
  });

  it('should render table with data', () => {
    const mockSecrets = [
      {
        metadata: { name: 'secret-1', namespace: 'default' },
        scope: 'strict',
        encryptedKeysCount: 2,
        isSynced: true,
        getAge: () => '1d',
      },
      {
        metadata: { name: 'secret-2', namespace: 'prod' },
        scope: 'namespace-wide',
        encryptedKeysCount: 1,
        isSynced: false,
        getAge: () => '3h',
      },
    ];
    mockUseList.mockReturnValue([mockSecrets, null, false] as never);

    render(<SealedSecretList />);

    expect(screen.getByTestId('simple-table')).toBeDefined();
  });

  it('should show create button when user has create permission', () => {
    mockUseList.mockReturnValue([[], null, false] as never);
    mockUsePermission.mockReturnValue({ loading: false, allowed: true });

    render(<SealedSecretList />);

    expect(screen.getByText('Create Sealed Secret')).toBeDefined();
  });

  it('should hide create button when user lacks create permission', () => {
    mockUseList.mockReturnValue([[], null, false] as never);
    mockUsePermission.mockReturnValue({ loading: false, allowed: false });

    render(<SealedSecretList />);

    expect(screen.queryByText('Create Sealed Secret')).toBeNull();
  });

  it('should render VersionWarning', () => {
    mockUseList.mockReturnValue([[], null, false] as never);

    render(<SealedSecretList />);

    expect(screen.getByTestId('version-warning')).toBeDefined();
  });
});
