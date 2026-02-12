/**
 * Decrypt Dialog
 *
 * Shows the decrypted value of a secret key by reading the resulting
 * Kubernetes Secret (requires RBAC permissions to read secrets)
 */

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
import { ContentCopy as CopyIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import React from 'react';
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
  const { enqueueSnackbar } = useSnackbar();

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
      <Dialog open onClose={onClose}>
        <DialogTitle>Secret Not Found</DialogTitle>
        <DialogContent>
          <Typography>
            The Kubernetes Secret for this SealedSecret has not been created yet, or you don't have
            permission to read it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Check if key exists
  const encodedValue = secret.data?.[secretKey];
  if (!encodedValue) {
    return (
      <Dialog open onClose={onClose}>
        <DialogTitle>Key Not Found</DialogTitle>
        <DialogContent>
          <Typography>
            The key <strong>{secretKey}</strong> was not found in the Secret.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const decodedValue = atob(encodedValue);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Decrypted Value: {secretKey}
        <Typography variant="caption" display="block" color="text.secondary">
          Auto-closing in {countdown} seconds
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={10}
            value={decodedValue}
            type={showValue ? 'text' : 'password'}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <IconButton onClick={() => setShowValue(!showValue)} size="small">
                    {showValue ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                  <IconButton onClick={handleCopy} size="small">
                    <CopyIcon />
                  </IconButton>
                </Box>
              ),
            }}
          />
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Security Warning:</strong> This value is sensitive. Ensure no one is looking
              over your shoulder.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
