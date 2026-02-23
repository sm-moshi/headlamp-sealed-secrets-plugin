/**
 * Custom Hook for SealedSecret Encryption
 *
 * Encapsulates the business logic for encrypting secrets and creating SealedSecrets.
 * Handles certificate fetching, validation, expiry warnings, encryption, and object creation.
 */

import React from 'react';
import { fetchPublicCertificate, getPluginConfig } from '../lib/controller';
import {
  encryptKeyValues,
  isCertificateExpiringSoon,
  parseCertificateInfo,
  parsePublicKeyFromCert,
} from '../lib/crypto';
import { validateSecretKey, validateSecretName, validateSecretValue } from '../lib/validators';
import {
  AsyncResult,
  CertificateInfo,
  Err,
  Ok,
  PlaintextValue,
  SealedSecretScope,
} from '../types';
import { useNotification } from './useNotification';

/**
 * Request parameters for encryption
 */
export interface EncryptionRequest {
  /** Name of the SealedSecret to create */
  name: string;
  /** Namespace to create the SealedSecret in */
  namespace: string;
  /** Encryption scope (strict, namespace-wide, cluster-wide) */
  scope: SealedSecretScope;
  /** Key-value pairs to encrypt */
  keyValues: Array<{ key: string; value: string }>;
}

/**
 * Result of successful encryption
 */
export interface EncryptionResult {
  /** The complete SealedSecret object ready to apply */
  sealedSecretData: any;
  /** Information about the certificate used */
  certificateInfo?: CertificateInfo;
}

/**
 * Custom hook for SealedSecret encryption
 *
 * Provides encryption functionality with built-in validation, error handling,
 * and user notifications.
 *
 * @returns Object with encrypt function and encrypting state
 *
 * @example
 * const { encrypt, encrypting } = useSealedSecretEncryption();
 *
 * const result = await encrypt({
 *   name: 'my-secret',
 *   namespace: 'default',
 *   scope: 'strict',
 *   keyValues: [{ key: 'password', value: 'secret123' }]
 * });
 *
 * if (result.ok) {
 *   // Use result.value.sealedSecretData
 * }
 */
export function useSealedSecretEncryption() {
  const [encrypting, setEncrypting] = React.useState(false);
  const { enqueueSnackbar } = useNotification();

  const encrypt = React.useCallback(
    async (request: EncryptionRequest): AsyncResult<EncryptionResult, string> => {
      setEncrypting(true);

      try {
        // Step 1: Validate inputs
        const nameValidation = validateSecretName(request.name);
        if (!nameValidation.valid) {
          enqueueSnackbar(nameValidation.error, { variant: 'error' });
          return Err(nameValidation.error || 'Invalid secret name');
        }

        // Validate all key-value pairs
        for (const kv of request.keyValues) {
          const keyValidation = validateSecretKey(kv.key);
          if (!keyValidation.valid) {
            const error = `Invalid key "${kv.key}": ${keyValidation.error}`;
            enqueueSnackbar(error, { variant: 'error' });
            return Err(error);
          }

          const valueValidation = validateSecretValue(kv.value);
          if (!valueValidation.valid) {
            const error = `Invalid value for key "${kv.key}": ${valueValidation.error}`;
            enqueueSnackbar(error, { variant: 'error' });
            return Err(error);
          }
        }

        if (request.keyValues.length === 0) {
          const error = 'At least one key-value pair is required';
          enqueueSnackbar(error, { variant: 'error' });
          return Err(error);
        }

        // Step 2: Fetch the controller's public certificate
        const config = getPluginConfig();
        const certResult = await fetchPublicCertificate(config);

        if (certResult.ok === false) {
          const error = `Failed to fetch certificate: ${certResult.error}`;
          enqueueSnackbar(error, { variant: 'error' });
          return Err(error);
        }

        // Step 3: Check certificate expiry and warn user
        let certInfo: CertificateInfo | undefined;
        const certInfoResult = parseCertificateInfo(certResult.value);
        if (certInfoResult.ok) {
          certInfo = certInfoResult.value;

          if (certInfo.isExpired) {
            enqueueSnackbar(
              `Warning: Controller certificate expired on ${certInfo.validTo.toLocaleDateString()}. ` +
                'Secrets may not be decryptable.',
              { variant: 'warning' }
            );
          } else if (isCertificateExpiringSoon(certInfo, 30)) {
            enqueueSnackbar(
              `Warning: Controller certificate expires in ${certInfo.daysUntilExpiry} days ` +
                `(${certInfo.validTo.toLocaleDateString()}).`,
              { variant: 'warning' }
            );
          }
        }

        // Step 4: Parse the public key from certificate
        const keyResult = parsePublicKeyFromCert(certResult.value);

        if (keyResult.ok === false) {
          const error = `Invalid certificate: ${keyResult.error}`;
          enqueueSnackbar(error, { variant: 'error' });
          return Err(error);
        }

        // Step 5: Encrypt all values client-side
        const encryptResult = encryptKeyValues(
          keyResult.value,
          request.keyValues.map(kv => ({ key: kv.key, value: PlaintextValue(kv.value) })),
          request.namespace,
          request.name,
          request.scope
        );

        if (encryptResult.ok === false) {
          const error = `Encryption failed: ${encryptResult.error}`;
          enqueueSnackbar(error, { variant: 'error' });
          return Err(error);
        }

        // Step 6: Construct the SealedSecret object
        const sealedSecretData: any = {
          apiVersion: 'bitnami.com/v1alpha1',
          kind: 'SealedSecret',
          metadata: {
            name: request.name,
            namespace: request.namespace,
            annotations: {},
          },
          spec: {
            encryptedData: encryptResult.value,
            template: {
              metadata: {},
            },
          },
        };

        // Add scope annotations
        if (request.scope === 'namespace-wide') {
          sealedSecretData.metadata.annotations['sealedsecrets.bitnami.com/namespace-wide'] =
            'true';
        } else if (request.scope === 'cluster-wide') {
          sealedSecretData.metadata.annotations['sealedsecrets.bitnami.com/cluster-wide'] = 'true';
        }

        return Ok({
          sealedSecretData,
          certificateInfo: certInfo,
        });
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown encryption error';
        enqueueSnackbar(errorMsg, { variant: 'error' });
        return Err(errorMsg);
      } finally {
        setEncrypting(false);
      }
    },
    [enqueueSnackbar]
  );

  return { encrypt, encrypting };
}
