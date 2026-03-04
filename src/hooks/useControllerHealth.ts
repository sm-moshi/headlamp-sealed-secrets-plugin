/**
 * Custom Hook for Controller Health Monitoring
 *
 * Provides controller health status with automatic refresh capability.
 */

import React from 'react';
import { checkControllerHealth, ControllerHealthStatus, getPluginConfig } from '../lib/controller';

/**
 * Custom hook for monitoring controller health
 *
 * Automatically checks controller health on mount and can optionally
 * refresh at a specified interval.
 *
 * @param autoRefresh Whether to automatically refresh health status
 * @param refreshIntervalMs Refresh interval in milliseconds (default: 30000ms = 30s)
 * @returns Object with health status, loading state, and manual refresh function
 *
 * @example
 * // Manual refresh only
 * const { health, loading, refresh } = useControllerHealth();
 *
 * // Auto-refresh every 30 seconds
 * const { health, loading } = useControllerHealth(true, 30000);
 *
 * // Auto-refresh every 10 seconds
 * const { health, loading } = useControllerHealth(true, 10000);
 */
export function useControllerHealth(autoRefresh = false, refreshIntervalMs = 30000) {
  const [health, setHealth] = React.useState<ControllerHealthStatus | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchHealth = React.useCallback(async () => {
    setLoading(true);

    const config = getPluginConfig();
    const result = await checkControllerHealth(config);

    if (result.ok === false) {
      setHealth({
        healthy: false,
        reachable: false,
        error: result.error,
      });
    } else {
      setHealth(result.value);
    }

    setLoading(false);
  }, []);

  // Initial fetch and auto-refresh setup
  React.useEffect(() => {
    fetchHealth();

    if (autoRefresh) {
      const interval = setInterval(fetchHealth, refreshIntervalMs);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshIntervalMs, fetchHealth]);

  return {
    health,
    loading,
    refresh: fetchHealth,
  };
}
