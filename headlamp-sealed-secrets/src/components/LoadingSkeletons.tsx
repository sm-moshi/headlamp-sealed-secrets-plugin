/**
 * Loading Skeleton Components
 *
 * Provides visual feedback during data loading with skeleton screens
 * to improve perceived performance and user experience.
 */

import { Box, Skeleton } from '@mui/material';
import React from 'react';

/**
 * Skeleton for SealedSecrets list view
 *
 * Shows placeholder rows while data is loading
 */
export function SealedSecretListSkeleton() {
  return (
    <Box p={2}>
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={60}
          sx={{ mb: 1, borderRadius: 1 }}
          animation="wave"
        />
      ))}
    </Box>
  );
}

/**
 * Skeleton for SealedSecret detail view
 *
 * Shows placeholder sections while resource is loading
 */
export function SealedSecretDetailSkeleton() {
  return (
    <Box p={3}>
      {/* Title */}
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 3 }} animation="wave" />

      {/* Metadata section */}
      <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 1 }} animation="wave" />

      {/* Encrypted data section */}
      <Skeleton variant="rectangular" height={150} sx={{ mb: 2, borderRadius: 1 }} animation="wave" />

      {/* Actions section */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} animation="wave" />
        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} animation="wave" />
      </Box>
    </Box>
  );
}

/**
 * Skeleton for sealing keys list view
 *
 * Shows placeholder for certificate information
 */
export function SealingKeysListSkeleton() {
  return (
    <Box p={2}>
      {[1, 2].map(i => (
        <Box key={i} sx={{ mb: 3 }}>
          <Skeleton variant="text" width="30%" height={32} sx={{ mb: 1 }} animation="wave" />
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1, mb: 1 }} animation="wave" />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rectangular" width={100} height={28} sx={{ borderRadius: 1 }} animation="wave" />
            <Skeleton variant="rectangular" width={100} height={28} sx={{ borderRadius: 1 }} animation="wave" />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Skeleton for certificate information
 *
 * Shows placeholder for certificate metadata
 */
export function CertificateInfoSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width="60%" animation="wave" />
      <Skeleton variant="text" width="40%" animation="wave" />
      <Skeleton variant="text" width="50%" animation="wave" />
      <Skeleton variant="text" width="45%" animation="wave" />
    </Box>
  );
}

/**
 * Skeleton for controller health status
 *
 * Shows placeholder for health check information
 */
export function ControllerHealthSkeleton() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Skeleton variant="circular" width={40} height={40} animation="wave" />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="40%" animation="wave" />
        <Skeleton variant="text" width="60%" animation="wave" />
      </Box>
    </Box>
  );
}
