/**
 * Unit tests for useControllerHealth hook
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock controller module
vi.mock('../lib/controller', () => ({
  checkControllerHealth: vi.fn(),
  getPluginConfig: vi.fn().mockReturnValue({
    controllerName: 'sealed-secrets-controller',
    controllerNamespace: 'kube-system',
    controllerPort: 8080,
  }),
}));

import { checkControllerHealth } from '../lib/controller';
import { useControllerHealth } from './useControllerHealth';

const mockCheckHealth = vi.mocked(checkControllerHealth);

describe('useControllerHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start in loading state', () => {
    mockCheckHealth.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useControllerHealth());

    expect(result.current.loading).toBe(true);
    expect(result.current.health).toBe(null);
  });

  it('should fetch health on mount', async () => {
    mockCheckHealth.mockResolvedValue({
      ok: true,
      value: {
        healthy: true,
        reachable: true,
        version: '0.24.0',
        latencyMs: 42,
      },
    });

    const { result } = renderHook(() => useControllerHealth());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.health).toEqual({
      healthy: true,
      reachable: true,
      version: '0.24.0',
      latencyMs: 42,
    });
  });

  it('should handle error result', async () => {
    mockCheckHealth.mockResolvedValue({
      ok: false,
      error: 'Controller unreachable',
    });

    const { result } = renderHook(() => useControllerHealth());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.health).toEqual({
      healthy: false,
      reachable: false,
      error: 'Controller unreachable',
    });
  });

  it('should auto-refresh at specified interval', async () => {
    mockCheckHealth.mockResolvedValue({
      ok: true,
      value: { healthy: true, reachable: true },
    });

    renderHook(() => useControllerHealth(true, 10000));

    // Initial call
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(mockCheckHealth).toHaveBeenCalledTimes(1);

    // Advance timer by refresh interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(mockCheckHealth).toHaveBeenCalledTimes(2);

    // Another interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(mockCheckHealth).toHaveBeenCalledTimes(3);
  });

  it('should not auto-refresh by default', async () => {
    mockCheckHealth.mockResolvedValue({
      ok: true,
      value: { healthy: true, reachable: true },
    });

    renderHook(() => useControllerHealth());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockCheckHealth).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(60000);
      await vi.runAllTimersAsync();
    });

    // Still just 1 call - no auto-refresh
    expect(mockCheckHealth).toHaveBeenCalledTimes(1);
  });

  it('should provide manual refresh function', async () => {
    mockCheckHealth.mockResolvedValue({
      ok: true,
      value: { healthy: true, reachable: true },
    });

    const { result } = renderHook(() => useControllerHealth());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockCheckHealth).toHaveBeenCalledTimes(1);

    // Manual refresh
    await act(async () => {
      result.current.refresh();
      await vi.runAllTimersAsync();
    });

    expect(mockCheckHealth).toHaveBeenCalledTimes(2);
  });

  it('should cleanup interval on unmount', async () => {
    mockCheckHealth.mockResolvedValue({
      ok: true,
      value: { healthy: true, reachable: true },
    });

    const { unmount } = renderHook(() => useControllerHealth(true, 5000));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(mockCheckHealth).toHaveBeenCalledTimes(1);

    unmount();

    // Advance time - no more calls after unmount
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });

    expect(mockCheckHealth).toHaveBeenCalledTimes(1);
  });
});
