/**
 * Sealing Keys Management View
 *
 * Lists all sealing key pairs (TLS Secrets) used by the controller
 */

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox, SimpleTable, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, Chip } from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { fetchPublicCertificate, getPluginConfig } from '../lib/controller';
import { isCertificateExpiringSoon, parseCertificateInfo } from '../lib/crypto';
import { CertificateInfo, PEMCertificate } from '../types';
import { ControllerStatus } from './ControllerStatus';
import { SealingKeysListSkeleton } from './LoadingSkeletons';

interface SealingKey {
  name: string;
  status: 'active' | 'compromised';
  created: string;
  certInfo?: CertificateInfo;
}

/**
 * Sealing keys management view
 */
export function SealingKeysView() {
  const config = getPluginConfig();
  const [secrets, , loading] = K8s.ResourceClasses.Secret.useList({ namespace: config.controllerNamespace });
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

        let certInfo: CertificateInfo | undefined;
        if (certPem) {
          const infoResult = parseCertificateInfo(PEMCertificate(certPem));
          if (infoResult.ok) {
            certInfo = infoResult.value;
          }
        }

        return {
          name: secret.metadata.name!,
          status,
          created: secret.metadata.creationTimestamp!,
          certInfo,
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

  // Show loading skeleton while data is being fetched
  if (loading) {
    return (
      <SectionBox title="Sealing Keys">
        <SealingKeysListSkeleton />
      </SectionBox>
    );
  }

  return (
    <SectionBox
      title="Sealing Keys"
      headerProps={{
        actions: [
          <ControllerStatus key="status" autoRefresh refreshIntervalMs={60000} showDetails />,
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
                label: 'Certificate Expiry',
                getter: (key: SealingKey) => {
                  if (!key.certInfo) return 'N/A';

                  const { certInfo } = key;
                  const expiryDate = certInfo.validTo.toLocaleDateString();

                  if (certInfo.isExpired) {
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="Expired" color="error" size="small" />
                        <span>{expiryDate}</span>
                      </Box>
                    );
                  }

                  if (isCertificateExpiringSoon(certInfo, 30)) {
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={`${certInfo.daysUntilExpiry} days left`}
                          color="warning"
                          size="small"
                        />
                        <span>{expiryDate}</span>
                      </Box>
                    );
                  }

                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{expiryDate}</span>
                      <span style={{ color: '#666', fontSize: '0.9em' }}>
                        ({certInfo.daysUntilExpiry} days)
                      </span>
                    </Box>
                  );
                },
              },
            ]}
          />
        </>
      )}
    </SectionBox>
  );
}
