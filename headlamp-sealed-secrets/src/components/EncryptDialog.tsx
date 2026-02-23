/**
 * Encryption Dialog
 *
 * Dialog for creating new SealedSecrets by encrypting secret values
 * client-side using the controller's public certificate
 */

import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNotification } from '../hooks/useNotification';
import { useSealedSecretEncryption } from '../hooks/useSealedSecretEncryption';
import { SealedSecret } from '../lib/SealedSecretCRD';
import { SealedSecretScope, SecretKeyValue } from '../types';

interface EncryptDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Encrypt dialog component
 */
export function EncryptDialog({ open, onClose }: EncryptDialogProps) {
  const [name, setName] = React.useState('');
  const [namespace, setNamespace] = React.useState('default');
  const [scope, setScope] = React.useState<SealedSecretScope>('strict');
  const [keyValues, setKeyValues] = React.useState<(SecretKeyValue & { showValue: boolean })[]>([
    { key: '', value: '', showValue: false },
  ]);
  const { enqueueSnackbar } = useNotification();
  const { encrypt, encrypting } = useSealedSecretEncryption();

  const [namespaces] = K8s.ResourceClasses.Namespace.useList();

  // Memoize callbacks to prevent re-renders
  const handleAddKeyValue = React.useCallback(() => {
    setKeyValues(prev => [...prev, { key: '', value: '', showValue: false }]);
  }, []);

  const handleRemoveKeyValue = React.useCallback((index: number) => {
    setKeyValues(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyChange = React.useCallback((index: number, key: string) => {
    setKeyValues(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], key };
      return updated;
    });
  }, []);

  const handleValueChange = React.useCallback((index: number, value: string) => {
    setKeyValues(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  }, []);

  const toggleShowValue = React.useCallback((index: number) => {
    setKeyValues(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], showValue: !updated[index].showValue };
      return updated;
    });
  }, []);

  const handleCreate = async () => {
    // Filter out empty rows
    const validKeyValues = keyValues.filter(kv => kv.key || kv.value).map(kv => ({
      key: kv.key,
      value: kv.value,
    }));

    // Use the encryption hook
    const result = await encrypt({
      name,
      namespace,
      scope,
      keyValues: validKeyValues,
    });

    // If encryption failed, the hook already showed the error
    if (result.ok === false) {
      return;
    }

    try {
      // Apply the SealedSecret to the cluster
      await SealedSecret.apiEndpoint.post(result.value.sealedSecretData);

      enqueueSnackbar('SealedSecret created successfully', { variant: 'success' });

      // Clear form and close
      setName('');
      setNamespace('default');
      setScope('strict');
      setKeyValues([{ key: '', value: '', showValue: false }]);
      onClose();
    } catch (error: any) {
      enqueueSnackbar(`Failed to create SealedSecret: ${error.message}`, { variant: 'error' });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="encrypt-dialog-title"
      aria-describedby="encrypt-dialog-description"
    >
      <DialogTitle id="encrypt-dialog-title">Create Sealed Secret</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }} id="encrypt-dialog-description">
          <TextField
            fullWidth
            label="Secret Name"
            value={name}
            onChange={e => setName(e.target.value)}
            margin="normal"
            required
            inputProps={{
              'aria-label': 'Secret name',
              'aria-required': true,
            }}
            helperText="Must be a valid Kubernetes resource name (lowercase alphanumeric, hyphens)"
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="encrypt-namespace-label">Namespace</InputLabel>
            <Select
              value={namespace}
              label="Namespace"
              onChange={e => setNamespace(e.target.value)}
              labelId="encrypt-namespace-label"
              inputProps={{
                'aria-label': 'Namespace for the SealedSecret',
                'aria-required': true,
              }}
            >
              {namespaces?.map(ns => (
                <MenuItem key={ns.metadata.name} value={ns.metadata.name}>
                  {ns.metadata.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="encrypt-scope-label">Scope</InputLabel>
            <Select
              value={scope}
              label="Scope"
              onChange={e => setScope(e.target.value as SealedSecretScope)}
              labelId="encrypt-scope-label"
              inputProps={{
                'aria-label': 'Encryption scope for the SealedSecret',
                'aria-required': true,
              }}
            >
              <MenuItem value="strict">Strict (name + namespace bound)</MenuItem>
              <MenuItem value="namespace-wide">Namespace-wide (namespace bound)</MenuItem>
              <MenuItem value="cluster-wide">Cluster-wide (no binding)</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Secret Data
          </Typography>

          {keyValues.map((kv, index) => (
            <Box
              key={index}
              sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}
              role="group"
              aria-label={`Secret key-value pair ${index + 1}`}
            >
              <TextField
                label="Key Name"
                value={kv.key}
                onChange={e => handleKeyChange(index, e.target.value)}
                sx={{ flex: 1 }}
                inputProps={{
                  'aria-label': `Key name ${index + 1}`,
                }}
                helperText={index === 0 ? 'Alphanumeric, hyphens, underscores, or dots' : undefined}
              />
              <TextField
                label="Secret Value"
                type={kv.showValue ? 'text' : 'password'}
                value={kv.value}
                onChange={e => handleValueChange(index, e.target.value)}
                sx={{ flex: 2 }}
                autoComplete="off"
                spellCheck={false}
                inputProps={{
                  'aria-label': `Secret value for ${kv.key || `key ${index + 1}`}`,
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => toggleShowValue(index)}
                      edge="end"
                      aria-label={kv.showValue ? 'Hide password' : 'Show password'}
                      tabIndex={0}
                    >
                      {kv.showValue ? <Icon icon="mdi:eye-off" /> : <Icon icon="mdi:eye" />}
                    </IconButton>
                  ),
                }}
              />
              <IconButton
                onClick={() => handleRemoveKeyValue(index)}
                disabled={keyValues.length === 1}
                color="error"
                aria-label={`Remove key-value pair ${index + 1}`}
                title={keyValues.length === 1 ? 'At least one key-value pair is required' : `Remove key-value pair ${index + 1}`}
              >
                <Icon icon="mdi:delete" />
              </IconButton>
            </Box>
          ))}

          <Button
            startIcon={<Icon icon="mdi:plus" />}
            onClick={handleAddKeyValue}
            aria-label="Add another key-value pair"
          >
            Add Another Key
          </Button>

          <Box
            sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}
            role="note"
            aria-live="polite"
          >
            <Typography variant="body2">
              <strong>Security Note:</strong> Secret values are encrypted entirely in your browser
              using the controller's public key. The plaintext values never leave your machine.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={encrypting} aria-label="Cancel creation">
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={encrypting}
          aria-busy={encrypting}
          aria-label={encrypting ? 'Encrypting and creating SealedSecret' : 'Create SealedSecret'}
        >
          {encrypting ? 'Encrypting & Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
