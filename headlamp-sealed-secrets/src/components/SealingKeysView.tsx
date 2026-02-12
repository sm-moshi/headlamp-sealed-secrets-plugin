/**
 * Sealing Keys Management View
 *
 * Lists all sealing key pairs (TLS Secrets) used by the controller
 */

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox, SimpleTable, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button } from '@mui/material';
import forge from 'node-forge';
import { useSnackbar } from 'notistack';
import React from 'react';
import { fetchPublicCertificate, getPluginConfig } from '../lib/controller';

interface SealingKey {
  name: string;
  status: 'active' | 'compromised';
  created: string;
  notBefore?: string;
  notAfter?: string;
}

/**
 * Parse certificate dates from TLS secret
 */
function parseCertificateDates(certPem: string): { notBefore?: string; notAfter?: string } {
  try {
    const cert = forge.pki.certificateFromPem(certPem);
    return {
      notBefore: cert.validity.notBefore.toISOString(),
      notAfter: cert.validity.notAfter.toISOString(),
    };
  } catch {
    return {};
  }
}

/**
 * Sealing keys management view
 */
export function SealingKeysView() {
  const config = getPluginConfig();
  const [secrets] = K8s.ResourceClasses.Secret.useList({ namespace: config.controllerNamespace });
  const { enqueueSnackbar } = useSnackbar();

  // Filter for sealing key secrets
  const sealingKeys: SealingKey[] = React.useMemo(() => {
    if (!secrets) return [];

    return secrets
      .filter(secret => {
        const labelValue = secret.metadata.labels?.['sealedsecrets.bitnami.com/sealed-secrets-key'];
        return labelValue === 'active' || labelValue === 'compromised';
      })
      .map(secret => {
        const status = secret.metadata.labels?.['sealedsecrets.bitnami.com/sealed-secrets-key'] as
          | 'active'
          | 'compromised';
        const certPem = secret.data?.['tls.crt'] ? atob(secret.data['tls.crt']) : '';
        const dates = certPem ? parseCertificateDates(certPem) : {};

        return {
          name: secret.metadata.name!,
          status,
          created: secret.metadata.creationTimestamp!,
          ...dates,
        };
      })
      .sort((a, b) => {
        // Sort active keys first, then by creation date (newest first)
        if (a.status !== b.status) {
          return a.status === 'active' ? -1 : 1;
        }
        return new Date(b.created).getTime() - new Date(a.created).getTime();
      });
  }, [secrets]);

  const handleDownloadCert = async () => {
    const result = await fetchPublicCertificate(config);

    if (result.ok === false) {
      enqueueSnackbar(`Failed to download certificate: ${result.error}`, { variant: 'error' });
      return;
    }

    try {
      const blob = new Blob([result.value], { type: 'application/x-pem-file' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sealed-secrets-cert.pem';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      enqueueSnackbar('Certificate downloaded', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(`Failed to create download: ${error.message}`, { variant: 'error' });
    }
  };

  return (
    <SectionBox
      title="Sealing Keys"
      headerProps={{
        actions: [
          <Button key="download" variant="contained" onClick={handleDownloadCert}>
            Download Public Certificate
          </Button>,
        ],
      }}
    >
      {sealingKeys.length === 0 ? (
        <Box p={2}>
          <p>No sealing keys found in namespace {config.controllerNamespace}.</p>
          <p>
            Ensure the Sealed Secrets controller is installed and running in the{' '}
            <strong>{config.controllerNamespace}</strong> namespace.
          </p>
        </Box>
      ) : (
        <>
          <Box p={2}>
            <p>
              Sealing keys are TLS key pairs used by the controller to decrypt SealedSecrets. The
              active key is used for new encryptions. Old keys are kept to decrypt existing
              SealedSecrets.
            </p>
          </Box>
          <SimpleTable
            data={sealingKeys}
            columns={[
              {
                label: 'Key Name',
                getter: (key: SealingKey) => key.name,
              },
              {
                label: 'Status',
                getter: (key: SealingKey) => (
                  <StatusLabel status={key.status === 'active' ? 'success' : 'warning'}>
                    {key.status === 'active' ? 'Active' : 'Compromised'}
                  </StatusLabel>
                ),
              },
              {
                label: 'Created',
                getter: (key: SealingKey) => new Date(key.created).toLocaleString(),
              },
              {
                label: 'Valid From',
                getter: (key: SealingKey) =>
                  key.notBefore ? new Date(key.notBefore).toLocaleString() : 'N/A',
              },
              {
                label: 'Valid Until',
                getter: (key: SealingKey) =>
                  key.notAfter ? new Date(key.notAfter).toLocaleString() : 'N/A',
              },
            ]}
          />
        </>
      )}
    </SectionBox>
  );
}
