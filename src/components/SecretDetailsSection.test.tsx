/**
 * Unit tests for SecretDetailsSection component
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Mock headlamp
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: { ResourceClasses: {} },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a data-testid="link" {...props}>
      {children}
    </a>
  ),
  NameValueTable: ({ rows }: { rows: Array<{ name: string; value: unknown }> }) => (
    <table>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td>{row.name}</td>
            <td>{typeof row.value === 'string' ? row.value : <>{row.value}</>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  SectionBox: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="section-box">
      <h2>{title}</h2>
      {children}
    </div>
  ),
  StatusLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('../lib/SealedSecretCRD', () => ({
  SealedSecret: {
    useGet: vi.fn(),
  },
}));

import { SealedSecret } from '../lib/SealedSecretCRD';
import { SecretDetailsSection } from './SecretDetailsSection';

const mockUseGet = vi.mocked(SealedSecret.useGet);

describe('SecretDetailsSection', () => {
  it('should return null when Secret has no SealedSecret owner', () => {
    const resource = {
      kind: 'Secret',
      metadata: {
        name: 'my-secret',
        namespace: 'default',
        ownerReferences: [
          { kind: 'Deployment', apiVersion: 'apps/v1', name: 'my-deploy', uid: '123' },
        ],
      },
    };

    const { container } = render(<SecretDetailsSection resource={resource} />);
    expect(container.innerHTML).toBe('');
  });

  it('should return null when Secret has no owner references', () => {
    const resource = {
      kind: 'Secret',
      metadata: {
        name: 'my-secret',
        namespace: 'default',
      },
    };

    const { container } = render(<SecretDetailsSection resource={resource} />);
    expect(container.innerHTML).toBe('');
  });

  it('should show loading text when SealedSecret is still loading', () => {
    mockUseGet.mockReturnValue([null, null] as never);

    const resource = {
      kind: 'Secret',
      metadata: {
        name: 'my-secret',
        namespace: 'default',
        ownerReferences: [
          {
            kind: 'SealedSecret',
            apiVersion: 'bitnami.com/v1alpha1',
            name: 'my-sealed-secret',
            uid: '456',
          },
        ],
      },
    };

    render(<SecretDetailsSection resource={resource} />);

    expect(screen.getByText('Sealed Secret')).toBeDefined();
    expect(screen.getByText('Loading SealedSecret information...')).toBeDefined();
  });

  it('should display SealedSecret info when loaded', () => {
    const mockSealedSecret = {
      metadata: {
        name: 'my-sealed-secret',
        namespace: 'default',
      },
      scope: 'strict',
      isSynced: true,
    };
    mockUseGet.mockReturnValue([mockSealedSecret, null] as never);

    const resource = {
      kind: 'Secret',
      metadata: {
        name: 'my-secret',
        namespace: 'default',
        ownerReferences: [
          {
            kind: 'SealedSecret',
            apiVersion: 'bitnami.com/v1alpha1',
            name: 'my-sealed-secret',
            uid: '789',
          },
        ],
      },
    };

    render(<SecretDetailsSection resource={resource} />);

    expect(screen.getByText('Sealed Secret')).toBeDefined();
    expect(screen.getByText('my-sealed-secret')).toBeDefined();
    expect(screen.getByText('Synced')).toBeDefined();
  });

  it('should show Not Synced status for unsynced SealedSecret', () => {
    const mockSealedSecret = {
      metadata: { name: 'ss', namespace: 'default' },
      scope: 'namespace-wide',
      isSynced: false,
    };
    mockUseGet.mockReturnValue([mockSealedSecret, null] as never);

    const resource = {
      kind: 'Secret',
      metadata: {
        name: 'my-secret',
        namespace: 'default',
        ownerReferences: [
          {
            kind: 'SealedSecret',
            apiVersion: 'bitnami.com/v1alpha1',
            name: 'ss',
            uid: '111',
          },
        ],
      },
    };

    render(<SecretDetailsSection resource={resource} />);

    expect(screen.getByText('Not Synced')).toBeDefined();
  });

  it('should filter by correct apiVersion', () => {
    const resource = {
      kind: 'Secret',
      metadata: {
        name: 'my-secret',
        namespace: 'default',
        ownerReferences: [
          {
            kind: 'SealedSecret',
            apiVersion: 'wrong-api/v1',
            name: 'wrong-ss',
            uid: '222',
          },
        ],
      },
    };

    const { container } = render(<SecretDetailsSection resource={resource} />);
    expect(container.innerHTML).toBe('');
  });
});
