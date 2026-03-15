/**
 * Version Warning Component
 *
 * Displays warnings about API version compatibility and issues.
 */

import { Alert, Box, Button, Link } from '@mui/material';
import React from 'react';
import { SealedSecret } from '../lib/SealedSecretCRD';

/** Controller version used in installation instructions */
const INSTALL_VERSION = 'v0.24.0';

export interface VersionWarningProps {
  /** Whether to auto-detect version on mount */
  autoDetect?: boolean;
  /** Whether to show detailed version information */
  showDetails?: boolean;
}

/**
 * Component that detects and displays API version information
 *
 * Shows warnings if:
 * - CRD is not installed
 * - Version detection fails
 * - Using non-default version (informational)
 */
export function VersionWarning({ autoDetect = true, showDetails = false }: VersionWarningProps) {
  const [loading, setLoading] = React.useState(true);
  const [detectedVersion, setDetectedVersion] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const detectVersion = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await SealedSecret.detectApiVersion();

      if (result.ok) {
        setDetectedVersion(result.value);
        setError(null);
      } else if (result.ok === false) {
        setDetectedVersion(null);
        // Ensure error is always a string
        const errorMessage = typeof result.error === 'string' ? result.error : String(result.error);
        setError(errorMessage);
      }
    } catch (e) {
      // Catch any unexpected errors
      setDetectedVersion(null);
      setError(e instanceof Error ? e.message : String(e));
    }

    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (autoDetect) {
      detectVersion();
    }
  }, [autoDetect, detectVersion]);

  // Don't show anything while loading
  if (loading) {
    return null;
  }

  // Show error if detection failed
  if (error) {
    return (
      <Box mb={2}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={detectVersion}>
              Retry
            </Button>
          }
        >
          <strong>API Version Detection Failed</strong>
          <br />
          {String(error)}
          {String(error).includes('not found') && (
            <>
              <br />
              <br />
              Install Sealed Secrets with:{' '}
              <code style={{ fontSize: '0.875em' }}>
                kubectl apply -f
                https://github.com/bitnami-labs/sealed-secrets/releases/download/{INSTALL_VERSION}/controller.yaml
              </code>
              <br />
              Or visit:{' '}
              <Link
                href="https://github.com/bitnami-labs/sealed-secrets"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
              >
                github.com/bitnami-labs/sealed-secrets
              </Link>
            </>
          )}
        </Alert>
      </Box>
    );
  }

  // Show informational message if using non-default version
  if (detectedVersion && detectedVersion !== SealedSecret.DEFAULT_VERSION) {
    return (
      <Box mb={2}>
        <Alert severity="info">
          <strong>API Version Detected</strong>
          <br />
          Using API version: <code>{detectedVersion}</code>
          {showDetails && (
            <>
              <br />
              Default version: <code>{SealedSecret.DEFAULT_VERSION}</code>
            </>
          )}
        </Alert>
      </Box>
    );
  }

  // Show success if explicitly showing details
  if (showDetails && detectedVersion) {
    return (
      <Box mb={2}>
        <Alert severity="success">
          <strong>API Version Detected</strong>
          <br />
          Using API version: <code>{detectedVersion}</code>
        </Alert>
      </Box>
    );
  }

  // Default: show nothing (version detected successfully)
  return null;
}
