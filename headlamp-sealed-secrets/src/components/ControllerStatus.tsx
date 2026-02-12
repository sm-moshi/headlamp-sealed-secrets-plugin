/**
 * Controller Status Indicator
 *
 * Displays the health status of the sealed-secrets controller,
 * including reachability, response time, and version information.
 */

import { CheckCircle, Error as ErrorIcon, Warning } from '@mui/icons-material';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { useControllerHealth } from '../hooks/useControllerHealth';
import { ControllerHealthSkeleton } from './LoadingSkeletons';

interface ControllerStatusProps {
  /** Whether to auto-refresh the status */
  autoRefresh?: boolean;
  /** Refresh interval in milliseconds (default: 30000 = 30s) */
  refreshIntervalMs?: number;
  /** Show detailed info (latency, version) */
  showDetails?: boolean;
}

/**
 * Controller status indicator component
 */
export function ControllerStatus({
  autoRefresh = false,
  refreshIntervalMs = 30000,
  showDetails = true,
}: ControllerStatusProps) {
  const { health: status, loading } = useControllerHealth(autoRefresh, refreshIntervalMs);

  // Show skeleton while loading
  if (loading || !status) {
    return <ControllerHealthSkeleton />;
  }

  // Build status message and icon
  let statusColor: 'success' | 'error' | 'warning' = 'error';
  let StatusIcon = ErrorIcon;
  let statusLabel = 'Unreachable';
  let tooltipText = status.error || 'Controller is unreachable';

  if (status.healthy) {
    statusColor = 'success';
    StatusIcon = CheckCircle;
    statusLabel = 'Healthy';
    tooltipText = `Controller is healthy${status.version ? ` (${status.version})` : ''}`;
  } else if (status.reachable) {
    statusColor = 'warning';
    StatusIcon = Warning;
    statusLabel = 'Unhealthy';
    tooltipText = status.error || 'Controller responded but is not healthy';
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={tooltipText}>
        <Chip
          icon={<StatusIcon />}
          label={statusLabel}
          color={statusColor}
          size="small"
          variant="outlined"
        />
      </Tooltip>

      {showDetails && status.healthy && (
        <>
          {status.latencyMs !== undefined && (
            <Typography variant="caption" color="text.secondary">
              {status.latencyMs}ms
            </Typography>
          )}
          {status.version && (
            <Typography variant="caption" color="text.secondary">
              v{status.version}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
