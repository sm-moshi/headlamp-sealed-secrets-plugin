/**
 * Secret Details Section
 *
 * Additional section shown in the Secret detail view if the Secret
 * is owned by a SealedSecret
 */

import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { NameValueTable, SectionBox, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { SealedSecret } from '../lib/SealedSecretCRD';

interface SecretDetailsSectionProps {
  resource: any; // The Secret resource
}

/**
 * Secret details section component
 */
export function SecretDetailsSection({ resource }: SecretDetailsSectionProps) {
  // Check if this Secret is owned by a SealedSecret
  const ownerRef = resource.metadata?.ownerReferences?.find(
    (ref: any) => ref.kind === 'SealedSecret' && ref.apiVersion === 'bitnami.com/v1alpha1'
  );

  if (!ownerRef) {
    return null;
  }

  // Fetch the parent SealedSecret
  const [sealedSecret] = SealedSecret.useGet(ownerRef.name, resource.metadata.namespace);

  return (
    <SectionBox title="Sealed Secret">
      {sealedSecret ? (
        <NameValueTable
          rows={[
            {
              name: 'Parent SealedSecret',
              value: (
                <Link
                  routeName="sealedsecret"
                  params={{
                    namespace: sealedSecret.metadata.namespace,
                    name: sealedSecret.metadata.name,
                  }}
                >
                  {sealedSecret.metadata.name}
                </Link>
              ),
            },
            {
              name: 'Scope',
              value: sealedSecret.scope,
            },
            {
              name: 'Sync Status',
              value: (
                <StatusLabel status={sealedSecret.isSynced ? 'success' : 'error'}>
                  {sealedSecret.isSynced ? 'Synced' : 'Not Synced'}
                </StatusLabel>
              ),
            },
          ]}
        />
      ) : (
        <p>Loading SealedSecret information...</p>
      )}
    </SectionBox>
  );
}
