/**
 * Unit tests for DecryptDialog component
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock notistack
const mockEnqueueSnackbar = vi.fn();
vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

// Mock iconify
vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid="icon">{icon}</span>,
}));

// Mock headlamp
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      Secret: {
        useGet: vi.fn(),
      },
    },
  },
}));

vi.mock('../lib/SealedSecretCRD', () => ({
  SealedSecret: {},
}));

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { DecryptDialog } from './DecryptDialog';

const mockUseGetSecret = vi.mocked(K8s.ResourceClasses.Secret.useGet);

describe('DecryptDialog', () => {
  const mockSealedSecret = {
    metadata: {
      name: 'my-secret',
      namespace: 'default',
    },
  } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show "Secret Not Found" when secret does not exist', () => {
    mockUseGetSecret.mockReturnValue([null, null] as never);

    render(
      <DecryptDialog sealedSecret={mockSealedSecret} secretKey="password" onClose={vi.fn()} />
    );

    expect(screen.getByText('Secret Not Found')).toBeDefined();
  });

  it('should show "Key Not Found" when key does not exist in secret', () => {
    mockUseGetSecret.mockReturnValue([{ data: { other: 'value' } }, null] as never);

    render(
      <DecryptDialog sealedSecret={mockSealedSecret} secretKey="missing-key" onClose={vi.fn()} />
    );

    expect(screen.getByText('Key Not Found')).toBeDefined();
    expect(screen.getByText('missing-key')).toBeDefined();
  });

  it('should decode and display base64 value', () => {
    const encoded = btoa('my-secret-value');
    mockUseGetSecret.mockReturnValue([{ data: { password: encoded } }, null] as never);

    render(
      <DecryptDialog sealedSecret={mockSealedSecret} secretKey="password" onClose={vi.fn()} />
    );

    expect(screen.getByText(/Decrypted Value: password/)).toBeDefined();
    // The value should be in a text field (hidden by default as password type)
    expect(screen.getByDisplayValue('my-secret-value')).toBeDefined();
  });

  it('should show countdown timer', () => {
    const encoded = btoa('value');
    mockUseGetSecret.mockReturnValue([{ data: { key: encoded } }, null] as never);

    render(<DecryptDialog sealedSecret={mockSealedSecret} secretKey="key" onClose={vi.fn()} />);

    expect(screen.getByText(/30 seconds/)).toBeDefined();
  });

  it('should auto-close after countdown', () => {
    const encoded = btoa('value');
    mockUseGetSecret.mockReturnValue([{ data: { key: encoded } }, null] as never);
    const onClose = vi.fn();

    render(<DecryptDialog sealedSecret={mockSealedSecret} secretKey="key" onClose={onClose} />);

    // Advance 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should copy to clipboard', () => {
    const encoded = btoa('copy-me');
    mockUseGetSecret.mockReturnValue([{ data: { key: encoded } }, null] as never);

    render(<DecryptDialog sealedSecret={mockSealedSecret} secretKey="key" onClose={vi.fn()} />);

    // Click copy button
    const copyButton = screen.getByLabelText('Copy value to clipboard');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copy-me');
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Copied to clipboard', {
      variant: 'success',
    });
  });

  it('should toggle show/hide value', () => {
    const encoded = btoa('toggle-me');
    mockUseGetSecret.mockReturnValue([{ data: { key: encoded } }, null] as never);

    render(<DecryptDialog sealedSecret={mockSealedSecret} secretKey="key" onClose={vi.fn()} />);

    // Initially hidden (password type)
    const showButton = screen.getByLabelText('Show secret value');
    fireEvent.click(showButton);

    // Now should show hide button
    expect(screen.getByLabelText('Hide secret value')).toBeDefined();
  });

  it('should close on Close button click', () => {
    mockUseGetSecret.mockReturnValue([null, null] as never);
    const onClose = vi.fn();

    render(<DecryptDialog sealedSecret={mockSealedSecret} secretKey="key" onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should show security warning', () => {
    const encoded = btoa('value');
    mockUseGetSecret.mockReturnValue([{ data: { key: encoded } }, null] as never);

    render(<DecryptDialog sealedSecret={mockSealedSecret} secretKey="key" onClose={vi.fn()} />);

    expect(screen.getByText(/Security Warning/)).toBeDefined();
  });
});
