/**
 * Unit tests for EncryptDialog component
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock useNotification (replaces notistack)
const mockEnqueueSnackbar = vi.fn();
vi.mock('../hooks/useNotification', () => ({
  useNotification: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

// Mock iconify
vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`}>{icon}</span>,
}));

// Mock headlamp
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      Namespace: {
        useList: vi
          .fn()
          .mockReturnValue([
            [{ metadata: { name: 'default' } }, { metadata: { name: 'production' } }],
          ]),
      },
    },
  },
}));

// Mock encryption hook
const mockEncrypt = vi.fn();
vi.mock('../hooks/useSealedSecretEncryption', () => ({
  useSealedSecretEncryption: () => ({
    encrypt: mockEncrypt,
    encrypting: false,
  }),
}));

// Mock SealedSecretCRD
vi.mock('../lib/SealedSecretCRD', () => ({
  SealedSecret: {
    apiEndpoint: {
      post: vi.fn(),
    },
  },
}));

import { SealedSecret } from '../lib/SealedSecretCRD';
import { EncryptDialog } from './EncryptDialog';

const mockPost = vi.mocked(SealedSecret.apiEndpoint.post);

describe('EncryptDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEncrypt.mockResolvedValue({
      ok: true,
      value: {
        sealedSecretData: { apiVersion: 'bitnami.com/v1alpha1', kind: 'SealedSecret' },
      },
    });
    mockPost.mockResolvedValue({});
  });

  it('should render dialog when open', () => {
    render(<EncryptDialog open onClose={vi.fn()} />);

    expect(screen.getByText('Create Sealed Secret')).toBeDefined();
    expect(screen.getByLabelText('Secret name')).toBeDefined();
  });

  it('should not render when closed', () => {
    render(<EncryptDialog open={false} onClose={vi.fn()} />);

    expect(screen.queryByText('Create Sealed Secret')).toBeNull();
  });

  it('should have one key-value pair by default', () => {
    render(<EncryptDialog open onClose={vi.fn()} />);

    expect(screen.getByLabelText('Key name 1')).toBeDefined();
  });

  it('should add key-value pair on button click', () => {
    render(<EncryptDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByLabelText('Add another key-value pair'));

    expect(screen.getByLabelText('Key name 2')).toBeDefined();
  });

  it('should not allow removing last key-value pair', () => {
    render(<EncryptDialog open onClose={vi.fn()} />);

    const removeButton = screen.getByLabelText('Remove key-value pair 1');
    expect(removeButton).toHaveAttribute('disabled');
  });

  it('should allow removing when multiple pairs exist', () => {
    render(<EncryptDialog open onClose={vi.fn()} />);

    // Add a pair
    fireEvent.click(screen.getByLabelText('Add another key-value pair'));

    // Both remove buttons should be enabled
    const removeButtons = screen.getAllByLabelText(/Remove key-value pair/);
    expect(removeButtons).toHaveLength(2);

    // Remove one
    fireEvent.click(removeButtons[1]);

    expect(screen.queryByLabelText('Key name 2')).toBeNull();
  });

  it('should call encrypt and post on submit', async () => {
    const onClose = vi.fn();
    render(<EncryptDialog open onClose={onClose} />);

    // Fill in name
    const nameInput = screen.getByLabelText('Secret name');
    fireEvent.change(nameInput, { target: { value: 'my-secret' } });

    // Fill in key-value
    fireEvent.change(screen.getByLabelText('Key name 1'), {
      target: { value: 'password' },
    });
    fireEvent.change(screen.getByLabelText(/Secret value for password/), {
      target: { value: 'secret123' },
    });

    // Submit
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockEncrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'my-secret',
          namespace: 'default',
          scope: 'strict',
          keyValues: [{ key: 'password', value: 'secret123' }],
        })
      );
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('SealedSecret created successfully', {
        variant: 'success',
      });
    });
  });

  it('should not submit when encryption fails', async () => {
    mockEncrypt.mockResolvedValue({ ok: false, error: 'Encryption failed' });

    render(<EncryptDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockEncrypt).toHaveBeenCalled();
    });

    expect(mockPost).not.toHaveBeenCalled();
  });

  it('should show error when API post fails', async () => {
    mockPost.mockRejectedValue(new Error('API error'));

    render(<EncryptDialog open onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Key name 1'), {
      target: { value: 'k' },
    });
    fireEvent.change(screen.getByLabelText(/Secret value for k/), {
      target: { value: 'v' },
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create SealedSecret'),
        { variant: 'error' }
      );
    });
  });

  it('should call onClose on Cancel', () => {
    const onClose = vi.fn();
    render(<EncryptDialog open onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Cancel creation'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should show security note', () => {
    render(<EncryptDialog open onClose={vi.fn()} />);

    expect(screen.getByText(/Security Note/)).toBeDefined();
    expect(screen.getByText(/encrypted entirely in your browser/)).toBeDefined();
  });

  it('should toggle password visibility', () => {
    render(<EncryptDialog open onClose={vi.fn()} />);

    const toggleButton = screen.getByLabelText('Show password');
    fireEvent.click(toggleButton);

    expect(screen.getByLabelText('Hide password')).toBeDefined();
  });
});
