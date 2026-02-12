/**
 * Headlamp Sealed Secrets Plugin
 *
 * A comprehensive plugin for managing Bitnami Sealed Secrets in Kubernetes.
 * Provides UI for viewing, creating, and managing encrypted secrets.
 *
 * Features:
 * - List and detail views for SealedSecrets
 * - Client-side encryption using controller's public key
 * - Sealing keys management
 * - Secret decryption (via K8s Secret access)
 * - Integration with Headlamp's Secret detail view
 *
 * @see https://github.com/bitnami-labs/sealed-secrets
 */

import {
  registerDetailsViewSection,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { SealedSecretDetail } from './components/SealedSecretDetail';
import { SealedSecretList } from './components/SealedSecretList';
import { SealingKeysView } from './components/SealingKeysView';
import { SecretDetailsSection } from './components/SecretDetailsSection';
import { SettingsPage } from './components/SettingsPage';

/**
 * Register sidebar navigation
 */

// Main "Sealed Secrets" entry
registerSidebarEntry({
  parent: null,
  name: 'sealed-secrets',
  label: 'Sealed Secrets',
  icon: 'mdi:lock',
  url: '/sealedsecrets',
});

// "All Sealed Secrets" child entry
registerSidebarEntry({
  parent: 'sealed-secrets',
  name: 'sealed-secrets-list',
  label: 'All Sealed Secrets',
  url: '/sealedsecrets',
});

// "Sealing Keys" child entry
registerSidebarEntry({
  parent: 'sealed-secrets',
  name: 'sealing-keys',
  label: 'Sealing Keys',
  url: '/sealedsecrets/keys',
});

// "Settings" child entry
registerSidebarEntry({
  parent: 'sealed-secrets',
  name: 'sealed-secrets-settings',
  label: 'Settings',
  url: '/sealedsecrets/settings',
});

/**
 * Register routes
 */

// List view
registerRoute({
  path: '/sealedsecrets',
  sidebar: 'sealed-secrets-list',
  component: () => <SealedSecretList />,
  exact: true,
});

// Detail view
registerRoute({
  path: '/sealedsecrets/:namespace/:name',
  sidebar: 'sealed-secrets-list',
  component: () => <SealedSecretDetail />,
  exact: true,
  name: 'sealedsecret',
});

// Sealing keys view
registerRoute({
  path: '/sealedsecrets/keys',
  sidebar: 'sealing-keys',
  component: () => <SealingKeysView />,
  exact: true,
});

// Settings page
registerRoute({
  path: '/sealedsecrets/settings',
  sidebar: 'sealed-secrets-settings',
  component: () => <SettingsPage />,
  exact: true,
});

/**
 * Register integration with Secret detail view
 *
 * Adds a "Sealed Secret" section to Secrets that are owned by SealedSecrets
 */
registerDetailsViewSection(({ resource }) => {
  if (resource?.kind === 'Secret') {
    return <SecretDetailsSection resource={resource} />;
  }
  return null;
});
