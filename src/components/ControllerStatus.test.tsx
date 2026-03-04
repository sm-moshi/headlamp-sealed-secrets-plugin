/**
 * Unit tests for ControllerStatus component
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid="icon">{icon}</span>,
}));

vi.mock('../hooks/useControllerHealth', () => ({
  useControllerHealth: vi.fn(),
}));

vi.mock('./LoadingSkeletons', () => ({
  ControllerHealthSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

import { useControllerHealth } from '../hooks/useControllerHealth';
import { ControllerStatus } from './ControllerStatus';

const mockUseHealth = vi.mocked(useControllerHealth);

describe('ControllerStatus', () => {
  it('should show skeleton while loading', () => {
    mockUseHealth.mockReturnValue({
      health: null,
      loading: true,
      refresh: vi.fn(),
    });

    render(<ControllerStatus />);

    expect(screen.getByTestId('skeleton')).toBeDefined();
  });

  it('should show healthy chip when controller is healthy', () => {
    mockUseHealth.mockReturnValue({
      health: {
        healthy: true,
        reachable: true,
        version: '0.24.0',
        latencyMs: 15,
      },
      loading: false,
      refresh: vi.fn(),
    });

    render(<ControllerStatus />);

    expect(screen.getByText('Healthy')).toBeDefined();
  });

  it('should show unhealthy chip when reachable but not healthy', () => {
    mockUseHealth.mockReturnValue({
      health: {
        healthy: false,
        reachable: true,
        error: 'HTTP 500: Internal Server Error',
      },
      loading: false,
      refresh: vi.fn(),
    });

    render(<ControllerStatus />);

    expect(screen.getByText('Unhealthy')).toBeDefined();
  });

  it('should show unreachable chip when not reachable', () => {
    mockUseHealth.mockReturnValue({
      health: {
        healthy: false,
        reachable: false,
        error: 'Connection refused',
      },
      loading: false,
      refresh: vi.fn(),
    });

    render(<ControllerStatus />);

    expect(screen.getByText('Unreachable')).toBeDefined();
  });

  it('should show latency and version when showDetails is true and healthy', () => {
    mockUseHealth.mockReturnValue({
      health: {
        healthy: true,
        reachable: true,
        version: '0.24.0',
        latencyMs: 42,
      },
      loading: false,
      refresh: vi.fn(),
    });

    render(<ControllerStatus showDetails />);

    expect(screen.getByText('42ms')).toBeDefined();
    expect(screen.getByText('v0.24.0')).toBeDefined();
  });

  it('should not show details when showDetails is false', () => {
    mockUseHealth.mockReturnValue({
      health: {
        healthy: true,
        reachable: true,
        version: '0.24.0',
        latencyMs: 42,
      },
      loading: false,
      refresh: vi.fn(),
    });

    render(<ControllerStatus showDetails={false} />);

    expect(screen.getByText('Healthy')).toBeDefined();
    expect(screen.queryByText('42ms')).toBeNull();
    expect(screen.queryByText('v0.24.0')).toBeNull();
  });

  it('should pass autoRefresh and interval to hook', () => {
    mockUseHealth.mockReturnValue({
      health: { healthy: true, reachable: true },
      loading: false,
      refresh: vi.fn(),
    });

    render(<ControllerStatus autoRefresh refreshIntervalMs={5000} />);

    expect(mockUseHealth).toHaveBeenCalledWith(true, 5000);
  });
});
