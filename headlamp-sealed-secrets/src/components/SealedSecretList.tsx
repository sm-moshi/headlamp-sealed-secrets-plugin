/**
 * SealedSecrets List View
 *
 * Displays all SealedSecrets in the cluster with filtering and navigation
 */

import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  SectionBox,
  SectionFilterHeader,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button } from '@mui/material';
import React from 'react';
import { usePermission } from '../hooks/usePermissions';
import { SealedSecret } from '../lib/SealedSecretCRD';
import { SealedSecretScope } from '../types';
import { EncryptDialog } from './EncryptDialog';

/**
 * Format scope for display
 */
function formatScope(scope: SealedSecretScope): string {
  switch (scope) {
    case 'strict':
      return 'Strict';
    case 'namespace-wide':
      return 'Namespace-wide';
    case 'cluster-wide':
      return 'Cluster-wide';
    default:
      return scope;
  }
}

/**
 * SealedSecrets list view component
 */
export function SealedSecretList() {
  const [sealedSecrets, error] = SealedSecret.useList();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const { allowed: canCreate } = usePermission(undefined, 'canCreate');

  // Show error if CRD is not installed
  if (error) {
    return (
      <SectionBox
        title="Sealed Secrets"
      >
        <Box p={2}>
          <StatusLabel status="error">Error</StatusLabel>
          <Box mt={2}>
            {error.message.includes('404') ? (
              <>
                <p>
                  Sealed Secrets CRD not found. Please ensure Sealed Secrets is installed on your
                  cluster.
                </p>
                <p>
                  Install with: <code>kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml</code>
                </p>
              </>
            ) : (
              <p>Failed to load Sealed Secrets: {error.message}</p>
            )}
          </Box>
        </Box>
      </SectionBox>
    );
  }

  return (
    <>
      <SectionBox
        title="Sealed Secrets"
      >
        <SectionFilterHeader
          title=""
          noNamespaceFilter={false}
          actions={
            canCreate
              ? [
                  <Button
                    key="create"
                    variant="contained"
                    color="primary"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    Create Sealed Secret
                  </Button>,
                ]
              : []
          }
        />
        <SimpleTable
          data={sealedSecrets}
          columns={[
            {
              label: 'Name',
              getter: (ss: SealedSecret) => (
                <Link
                  routeName="sealedsecret"
                  params={{
                    namespace: ss.metadata.namespace,
                    name: ss.metadata.name,
                  }}
                >
                  {ss.metadata.name}
                </Link>
              ),
            },
            {
              label: 'Namespace',
              getter: (ss: SealedSecret) => ss.metadata.namespace,
            },
            {
              label: 'Encrypted Keys',
              getter: (ss: SealedSecret) => ss.encryptedKeysCount,
            },
            {
              label: 'Scope',
              getter: (ss: SealedSecret) => formatScope(ss.scope),
            },
            {
              label: 'Sync Status',
              getter: (ss: SealedSecret) => (
                <StatusLabel status={ss.isSynced ? 'success' : 'error'}>
                  {ss.isSynced ? 'Synced' : 'Not Synced'}
                </StatusLabel>
              ),
            },
            {
              label: 'Age',
              getter: (ss: SealedSecret) => ss.getAge(),
            },
          ]}
        />
      </SectionBox>

      <EncryptDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </>
  );
}
