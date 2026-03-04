/**
 * Unit tests for SettingsPage component
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock notistack
const mockEnqueueSnackbar = vi.fn();
vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

// Mock controller
vi.mock('../lib/controller', () => ({
  getPluginConfig: vi.fn().mockReturnValue({
    controllerName: 'sealed-secrets-controller',
    controllerNamespace: 'kube-system',
    controllerPort: 8080,
  }),
  savePluginConfig: vi.fn(),
}));

// Mock sub-components
vi.mock('./ControllerStatus', () => ({
  ControllerStatus: () => <div data-testid="controller-status">Status</div>,
}));

vi.mock('./VersionWarning', () => ({
  VersionWarning: () => <div data-testid="version-warning">Version</div>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="section-box">
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

import { savePluginConfig } from '../lib/controller';
import { SettingsPage } from './SettingsPage';

const mockSave = vi.mocked(savePluginConfig);

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render settings form with default values', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Sealed Secrets Plugin Settings')).toBeDefined();
    expect(screen.getByDisplayValue('sealed-secrets-controller')).toBeDefined();
    expect(screen.getByDisplayValue('kube-system')).toBeDefined();
    expect(screen.getByDisplayValue('8080')).toBeDefined();
  });

  it('should render ControllerStatus and VersionWarning', () => {
    render(<SettingsPage />);

    expect(screen.getByTestId('controller-status')).toBeDefined();
    expect(screen.getByTestId('version-warning')).toBeDefined();
  });

  it('should save config on Save button click', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByText('Save Settings'));

    expect(mockSave).toHaveBeenCalledWith({
      controllerName: 'sealed-secrets-controller',
      controllerNamespace: 'kube-system',
      controllerPort: 8080,
    });
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Settings saved successfully', {
      variant: 'success',
    });
  });

  it('should reset to defaults on Reset button click', () => {
    render(<SettingsPage />);

    // Change a value first
    const nameInput = screen.getByDisplayValue('sealed-secrets-controller');
    fireEvent.change(nameInput, { target: { value: 'custom-name' } });
    expect(screen.getByDisplayValue('custom-name')).toBeDefined();

    // Reset
    fireEvent.click(screen.getByText('Reset to Defaults'));

    expect(screen.getByDisplayValue('sealed-secrets-controller')).toBeDefined();
    expect(screen.getByDisplayValue('kube-system')).toBeDefined();
    expect(screen.getByDisplayValue('8080')).toBeDefined();
  });

  it('should call onDataChange when form fields change', () => {
    const onDataChange = vi.fn();
    render(<SettingsPage onDataChange={onDataChange} />);

    const nameInput = screen.getByDisplayValue('sealed-secrets-controller');
    fireEvent.change(nameInput, { target: { value: 'new-controller' } });

    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({
        controllerName: 'new-controller',
      })
    );
  });

  it('should call onDataChange on save', () => {
    const onDataChange = vi.fn();
    render(<SettingsPage onDataChange={onDataChange} />);

    fireEvent.click(screen.getByText('Save Settings'));

    expect(onDataChange).toHaveBeenCalled();
  });

  it('should use data props for initial values when provided', () => {
    render(
      <SettingsPage
        data={{
          controllerName: 'from-props',
          controllerNamespace: 'custom-ns',
          controllerPort: 9090,
        }}
      />
    );

    expect(screen.getByDisplayValue('from-props')).toBeDefined();
    expect(screen.getByDisplayValue('custom-ns')).toBeDefined();
    expect(screen.getByDisplayValue('9090')).toBeDefined();
  });

  it('should show default values info section', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Default Values')).toBeDefined();
  });
});
