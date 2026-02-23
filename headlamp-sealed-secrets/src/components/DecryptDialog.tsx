/**
 * Decrypt Dialog
 *
 * Shows the decrypted value of a secret key by reading the resulting
 * Kubernetes Secret (requires RBAC permissions to read secrets)
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
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNotification } from '../hooks/useNotification';
import { SealedSecret } from '../lib/SealedSecretCRD';

interface DecryptDialogProps {
  sealedSecret: SealedSecret;
  secretKey: string;
  onClose: () => void;
}

/**
 * Decrypt dialog component
 */
export function DecryptDialog({ sealedSecret, secretKey, onClose }: DecryptDialogProps) {
  const [secret] = K8s.ResourceClasses.Secret.useGet(
    sealedSecret.metadata.name,
    sealedSecret.metadata.namespace
  );
  const [showValue, setShowValue] = React.useState(false);
  const [countdown, setCountdown] = React.useState(30);
  const { enqueueSnackbar } = useNotification();

  // Auto-hide after 30 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  const handleCopy = () => {
    if (secret && secret.data?.[secretKey]) {
      const decoded = atob(secret.data[secretKey]);
      navigator.clipboard.writeText(decoded);
      enqueueSnackbar('Copied to clipboard', { variant: 'success' });
    }
  };

  // Check if secret exists
  if (!secret) {
    return (
      <Dialog
        open
        onClose={onClose}
        aria-labelledby="decrypt-error-title"
        aria-describedby="decrypt-error-description"
      >
        <DialogTitle id="decrypt-error-title">Secret Not Found</DialogTitle>
        <DialogContent>
          <Typography id="decrypt-error-description">
            The Kubernetes Secret for this SealedSecret has not been created yet, or you don't have
            permission to read it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} aria-label="Close dialog">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Check if key exists
  const encodedValue = secret.data?.[secretKey];
  if (!encodedValue) {
    return (
      <Dialog
        open
        onClose={onClose}
        aria-labelledby="decrypt-key-error-title"
        aria-describedby="decrypt-key-error-description"
      >
        <DialogTitle id="decrypt-key-error-title">Key Not Found</DialogTitle>
        <DialogContent>
          <Typography id="decrypt-key-error-description">
            The key <strong>{secretKey}</strong> was not found in the Secret.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} aria-label="Close dialog">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const decodedValue = atob(encodedValue);

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="decrypt-dialog-title"
      aria-describedby="decrypt-dialog-description"
    >
      <DialogTitle id="decrypt-dialog-title">
        Decrypted Value: {secretKey}
        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          aria-live="polite"
          aria-atomic="true"
        >
          Auto-closing in {countdown} seconds
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }} id="decrypt-dialog-description">
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={10}
            value={decodedValue}
            type={showValue ? 'text' : 'password'}
            inputProps={{
              'aria-label': `Decrypted value for ${secretKey}`,
              readOnly: true,
            }}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <IconButton
                    onClick={() => setShowValue(!showValue)}
                    size="small"
                    aria-label={showValue ? 'Hide secret value' : 'Show secret value'}
                    title={showValue ? 'Hide secret value' : 'Show secret value'}
                  >
                    {showValue ? <Icon icon="mdi:eye-off" /> : <Icon icon="mdi:eye" />}
                  </IconButton>
                  <IconButton
                    onClick={handleCopy}
                    size="small"
                    aria-label="Copy value to clipboard"
                    title="Copy value to clipboard"
                  >
                    <Icon icon="mdi:content-copy" />
                  </IconButton>
                </Box>
              ),
            }}
          />
          <Box
            sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}
            role="alert"
            aria-live="polite"
          >
            <Typography variant="body2">
              <strong>Security Warning:</strong> This value is sensitive. Ensure no one is looking
              over your shoulder.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} aria-label="Close dialog">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
