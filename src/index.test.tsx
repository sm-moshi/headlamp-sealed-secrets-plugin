/**
 * Unit tests for plugin entry point
 *
 * Verifies that all registration functions are called at module load
 */

import { beforeAll, describe, expect, it, vi } from 'vitest';

// Mock registration functions
const mockRegisterRoute = vi.fn();
const mockRegisterSidebarEntry = vi.fn();
const mockRegisterDetailsViewSection = vi.fn();
const mockRegisterPluginSettings = vi.fn();

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  registerRoute: mockRegisterRoute,
  registerSidebarEntry: mockRegisterSidebarEntry,
  registerDetailsViewSection: mockRegisterDetailsViewSection,
  registerPluginSettings: mockRegisterPluginSettings,
}));

// Mock all component imports to avoid deep dependency resolution
vi.mock('./components/ErrorBoundary', () => ({
  ApiErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  GenericErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('./components/SealedSecretList', () => ({
  SealedSecretList: () => null,
}));

vi.mock('./components/SealingKeysView', () => ({
  SealingKeysView: () => null,
}));

vi.mock('./components/SecretDetailsSection', () => ({
  SecretDetailsSection: () => null,
}));

vi.mock('./components/SettingsPage', () => ({
  SettingsPage: () => null,
}));

import React from 'react';

describe('Plugin Entry Point', () => {
  beforeAll(async () => {
    // Import the module to trigger side effects (registrations)
    // @ts-expect-error - dynamic import not supported by base tsconfig module setting
    await import('./index');
  });

  it('should register sidebar entries', () => {
    // Main entry + 2 children = 3 sidebar entries
    expect(mockRegisterSidebarEntry).toHaveBeenCalledTimes(3);

    // Main "Sealed Secrets" entry
    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'sealed-secrets',
        label: 'Sealed Secrets',
        url: '/sealedsecrets',
        parent: null,
      })
    );

    // "All Sealed Secrets" child
    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: 'sealed-secrets',
        name: 'sealed-secrets-list',
      })
    );

    // "Sealing Keys" child
    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: 'sealed-secrets',
        name: 'sealing-keys',
      })
    );
  });

  it('should register routes', () => {
    // List route + Keys route = 2
    expect(mockRegisterRoute).toHaveBeenCalledTimes(2);

    // List/detail view route
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/sealedsecrets/:namespace?/:name?',
        name: 'sealedsecret',
      })
    );

    // Keys route
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/sealedsecrets/keys',
      })
    );
  });

  it('should register details view section for Secret resources', () => {
    expect(mockRegisterDetailsViewSection).toHaveBeenCalledTimes(1);
    expect(mockRegisterDetailsViewSection).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should register plugin settings', () => {
    expect(mockRegisterPluginSettings).toHaveBeenCalledTimes(1);
    expect(mockRegisterPluginSettings).toHaveBeenCalledWith(
      'sealed-secrets',
      expect.any(Function),
      true
    );
  });
});
