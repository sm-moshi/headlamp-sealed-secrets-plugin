/**
 * SealedSecret Detail View
 *
 * Shows detailed information about a specific SealedSecret including
 * encrypted data, template, resulting Secret, and actions
 */

import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Typography,
} from '@mui/material';
import React from 'react';
import { useParams } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { getPluginConfig, rotateSealedSecret } from '../lib/controller';
import { canDecryptSecrets } from '../lib/rbac';
import { SealedSecret } from '../lib/SealedSecretCRD';
import { SealedSecretScope } from '../types';
import { useNotification } from '../hooks/useNotification';
import { DecryptDialog } from './DecryptDialog';
import { SealedSecretDetailSkeleton } from './LoadingSkeletons';

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
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  const [sealedSecret, error] = SealedSecret.useGet(name || undefined, namespace || undefined);
  const [secret] = K8s.ResourceClasses.Secret.useGet(name || undefined, namespace || undefined);
  const [decryptKey, setDecryptKey] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [rotating, setRotating] = React.useState(false);
  const [canDecrypt, setCanDecrypt] = React.useState(false);
  const { enqueueSnackbar } = useNotification();
  const { permissions } = usePermissions(namespace || undefined);

  // Check if user can decrypt secrets (requires get permission on Secrets)
  React.useEffect(() => {
    if (namespace) {
      canDecryptSecrets(namespace).then(setCanDecrypt);
    }
  }, [namespace]);

  // Wait for required params before rendering
  if (!namespace || !name) {
    return <SealedSecretDetailSkeleton />;
  }

  // Show error if fetch failed
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Failed to load SealedSecret
          </Typography>
          <Typography variant="body2">
            {String(error)}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Show loading skeleton while data is being fetched
  if (!sealedSecret) {
    return <SealedSecretDetailSkeleton />;
  }

  // Memoize callbacks to prevent re-renders
  const handleDelete = React.useCallback(async () => {
    try {
      await sealedSecret.delete();
      enqueueSnackbar('SealedSecret deleted successfully', { variant: 'success' });
      window.history.back();
    } catch (error: any) {
      enqueueSnackbar(`Failed to delete SealedSecret: ${error.message}`, { variant: 'error' });
    }
    setDeleteDialogOpen(false);
  }, [sealedSecret, enqueueSnackbar]);

  const handleRotate = React.useCallback(async () => {
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
  }, [sealedSecret, enqueueSnackbar]);

  // Safety check - should never happen due to early returns above, but be defensive
  if (!sealedSecret?.spec?.encryptedData) {
    return <SealedSecretDetailSkeleton />;
  }

  const encryptedKeys = Object.keys(sealedSecret.spec.encryptedData);

  const handleClose = () => {
    window.history.back();
  };

  return (
    <>
      <Drawer
        anchor="right"
        open
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: '600px', md: '800px' },
            maxWidth: '100%',
          },
        }}
      >
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <SectionBox
            title={
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <IconButton onClick={handleClose} edge="start" size="small">
                    <Icon icon="mdi:close" />
                  </IconButton>
                  <span>{sealedSecret.metadata.name}</span>
                </Box>
                <Box>
                {permissions?.canUpdate && (
                  <Button
                    variant="outlined"
                    onClick={handleRotate}
                    disabled={rotating}
                    sx={{ mr: 1 }}
                  >
                    {rotating ? 'Re-encrypting...' : 'Re-encrypt'}
                  </Button>
                )}
                {permissions?.canDelete && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </Box>
          }
        >
          <NameValueTable
            rows={[
              {
                name: 'Name',
                value: String(sealedSecret.metadata.name || ''),
              },
              {
                name: 'Namespace',
                value: String(sealedSecret.metadata.namespace || ''),
              },
              {
                name: 'Scope',
                value: String(formatScope(sealedSecret.scope)),
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
                value: String(sealedSecret.syncMessage || 'Unknown'),
                hide: !sealedSecret.syncCondition,
              },
              {
                name: 'Age',
                value: String(sealedSecret.getAge() || ''),
              },
              {
                name: 'Created',
                value: sealedSecret.metadata.creationTimestamp
                  ? new Date(sealedSecret.metadata.creationTimestamp).toLocaleString()
                  : 'Unknown',
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
                getter: (row: any) =>
                  canDecrypt ? (
                    <Button size="small" onClick={() => setDecryptKey(row.key)}>
                      Decrypt
                    </Button>
                  ) : (
                    <Button size="small" disabled title="No permission to access Secrets">
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
                  value: String(sealedSecret.spec.template.type || 'Opaque'),
                },
                {
                  name: 'Labels',
                  value: String(JSON.stringify(sealedSecret.spec.template.metadata?.labels || {})),
                  hide: !sealedSecret.spec.template.metadata?.labels,
                },
                {
                  name: 'Annotations',
                  value: String(
                    JSON.stringify(sealedSecret.spec.template.metadata?.annotations || {})
                  ),
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
                  value: String(Object.keys(secret.data || {}).join(', ') || 'None'),
                },
                {
                  name: 'Link',
                  value: (
                    <Link
                      routeName="secret"
                      params={{
                        namespace: String(secret.metadata.namespace || ''),
                        name: String(secret.metadata.name || ''),
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
      </Drawer>
    </>
  );
}
