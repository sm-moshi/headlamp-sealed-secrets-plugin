/**
 * SealedSecret Detail View
 *
 * Shows detailed information about a specific SealedSecret including
 * encrypted data, template, resulting Secret, and actions
 */

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Link, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useParams } from 'react-router-dom';
import { getPluginConfig, rotateSealedSecret } from '../lib/controller';
import { SealedSecret } from '../lib/SealedSecretCRD';
import { SealedSecretScope } from '../types';
import { DecryptDialog } from './DecryptDialog';

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
 * SealedSecret detail view component
 */
export function SealedSecretDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [sealedSecret] = SealedSecret.useGet(name, namespace);
  const [secret] = K8s.ResourceClasses.Secret.useGet(name, namespace);
  const [decryptKey, setDecryptKey] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [rotating, setRotating] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();

  if (!sealedSecret) {
    return <Loader title="Loading SealedSecret..." />;
  }

  const handleDelete = async () => {
    try {
      await sealedSecret.delete();
      enqueueSnackbar('SealedSecret deleted successfully', { variant: 'success' });
      window.history.back();
    } catch (error: any) {
      enqueueSnackbar(`Failed to delete SealedSecret: ${error.message}`, { variant: 'error' });
    }
    setDeleteDialogOpen(false);
  };

  const handleRotate = async () => {
    setRotating(true);
    try {
      const config = getPluginConfig();
      const yaml = JSON.stringify(sealedSecret.jsonData);
      await rotateSealedSecret(config, yaml);
      enqueueSnackbar('SealedSecret re-encrypted successfully', { variant: 'success' });
      // The resource will auto-refresh via the watch
    } catch (error: any) {
      enqueueSnackbar(`Failed to re-encrypt: ${error.message}`, { variant: 'error' });
    } finally {
      setRotating(false);
    }
  };

  const encryptedKeys = Object.keys(sealedSecret.spec.encryptedData || {});

  return (
    <>
      <Box>
        <SectionBox
          title={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <span>{sealedSecret.metadata.name}</span>
              <Box>
                <Button
                  variant="outlined"
                  onClick={handleRotate}
                  disabled={rotating}
                  sx={{ mr: 1 }}
                >
                  {rotating ? 'Re-encrypting...' : 'Re-encrypt'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          }
        >
          <NameValueTable
            rows={[
              {
                name: 'Name',
                value: sealedSecret.metadata.name,
              },
              {
                name: 'Namespace',
                value: sealedSecret.metadata.namespace,
              },
              {
                name: 'Scope',
                value: formatScope(sealedSecret.scope),
              },
              {
                name: 'Sync Status',
                value: (
                  <StatusLabel status={sealedSecret.isSynced ? 'success' : 'error'}>
                    {sealedSecret.isSynced ? 'Synced' : 'Not Synced'}
                  </StatusLabel>
                ),
              },
              {
                name: 'Status Message',
                value: sealedSecret.syncMessage,
                hide: !sealedSecret.syncCondition,
              },
              {
                name: 'Age',
                value: sealedSecret.getAge(),
              },
              {
                name: 'Created',
                value: new Date(sealedSecret.metadata.creationTimestamp!).toLocaleString(),
              },
            ]}
          />
        </SectionBox>

        <SectionBox title="Encrypted Data">
          <SimpleTable
            data={encryptedKeys.map(key => ({
              key,
              value: sealedSecret.spec.encryptedData[key],
            }))}
            columns={[
              {
                label: 'Key',
                getter: (row: any) => row.key,
              },
              {
                label: 'Encrypted Value',
                getter: (row: any) => {
                  const val = row.value;
                  return val.length > 40 ? val.substring(0, 40) + '...' : val;
                },
              },
              {
                label: 'Actions',
                getter: (row: any) => (
                  <Button size="small" onClick={() => setDecryptKey(row.key)}>
                    Decrypt
                  </Button>
                ),
              },
            ]}
          />
        </SectionBox>

        {sealedSecret.spec.template && (
          <SectionBox title="Template">
            <NameValueTable
              rows={[
                {
                  name: 'Secret Type',
                  value: sealedSecret.spec.template.type || 'Opaque',
                },
                {
                  name: 'Labels',
                  value: JSON.stringify(sealedSecret.spec.template.metadata?.labels || {}),
                  hide: !sealedSecret.spec.template.metadata?.labels,
                },
                {
                  name: 'Annotations',
                  value: JSON.stringify(sealedSecret.spec.template.metadata?.annotations || {}),
                  hide: !sealedSecret.spec.template.metadata?.annotations,
                },
              ]}
            />
          </SectionBox>
        )}

        <SectionBox title="Resulting Secret">
          {secret ? (
            <NameValueTable
              rows={[
                {
                  name: 'Status',
                  value: <StatusLabel status="success">Secret exists</StatusLabel>,
                },
                {
                  name: 'Keys',
                  value: Object.keys(secret.data || {}).join(', '),
                },
                {
                  name: 'Link',
                  value: (
                    <Link
                      routeName="secret"
                      params={{
                        namespace: secret.metadata.namespace,
                        name: secret.metadata.name,
                      }}
                    >
                      View Secret
                    </Link>
                  ),
                },
              ]}
            />
          ) : (
            <Box p={2}>
              <StatusLabel status="warning">Secret not yet created</StatusLabel>
              <p>The controller will create the Secret once it processes this SealedSecret.</p>
            </Box>
          )}
        </SectionBox>
      </Box>

      {decryptKey && (
        <DecryptDialog
          sealedSecret={sealedSecret}
          secretKey={decryptKey}
          onClose={() => setDecryptKey(null)}
        />
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete SealedSecret?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the SealedSecret <strong>{name}</strong>? This will also
          delete the resulting Kubernetes Secret.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
