/**
 * Unit tests for ErrorBoundary components
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock MUI and iconify
vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid="icon">{icon}</span>,
}));

import { ApiErrorBoundary, GenericErrorBoundary } from './ErrorBoundary';

// Suppress console.error from error boundaries in tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

function ThrowingComponent({ error }: { error: Error }): React.ReactNode {
  throw error;
}

function GoodComponent() {
  return <div>Working fine</div>;
}

describe('ErrorBoundary', () => {
  describe('ApiErrorBoundary', () => {
    it('should render children when no error', () => {
      render(
        <ApiErrorBoundary>
          <GoodComponent />
        </ApiErrorBoundary>
      );

      expect(screen.getByText('Working fine')).toBeDefined();
    });

    it('should catch errors and show API error UI', () => {
      render(
        <ApiErrorBoundary>
          <ThrowingComponent error={new Error('API connection failed')} />
        </ApiErrorBoundary>
      );

      expect(screen.getByText('API Communication Error')).toBeDefined();
      expect(screen.getByText(/API connection failed/)).toBeDefined();
    });

    it('should show retry button that resets error', () => {
      render(
        <ApiErrorBoundary>
          <ThrowingComponent error={new Error('test error')} />
        </ApiErrorBoundary>
      );

      expect(screen.getByText('API Communication Error')).toBeDefined();

      // Click retry
      fireEvent.click(screen.getByText('Retry'));

      // After reset, it will try to render children again (which will throw again)
      // The boundary should catch it again
      expect(screen.getByText('API Communication Error')).toBeDefined();
    });

    it('should render custom fallback if provided', () => {
      render(
        <ApiErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowingComponent error={new Error('error')} />
        </ApiErrorBoundary>
      );

      expect(screen.getByText('Custom fallback')).toBeDefined();
    });

    it('should call onReset when retry is clicked', () => {
      const onReset = vi.fn();
      render(
        <ApiErrorBoundary onReset={onReset}>
          <ThrowingComponent error={new Error('error')} />
        </ApiErrorBoundary>
      );

      fireEvent.click(screen.getByText('Retry'));
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('should show guidance about troubleshooting', () => {
      render(
        <ApiErrorBoundary>
          <ThrowingComponent error={new Error('error')} />
        </ApiErrorBoundary>
      );

      expect(screen.getByText(/Kubernetes cluster is accessible/)).toBeDefined();
      expect(screen.getByText(/Sealed Secrets controller is running/)).toBeDefined();
    });
  });

  describe('GenericErrorBoundary', () => {
    it('should render children when no error', () => {
      render(
        <GenericErrorBoundary>
          <GoodComponent />
        </GenericErrorBoundary>
      );

      expect(screen.getByText('Working fine')).toBeDefined();
    });

    it('should catch errors and show generic error UI', () => {
      render(
        <GenericErrorBoundary>
          <ThrowingComponent error={new Error('Unexpected error')} />
        </GenericErrorBoundary>
      );

      expect(screen.getByText('Something Went Wrong')).toBeDefined();
      expect(screen.getByText(/Unexpected error/)).toBeDefined();
    });

    it('should show reload button', () => {
      render(
        <GenericErrorBoundary>
          <ThrowingComponent error={new Error('error')} />
        </GenericErrorBoundary>
      );

      expect(screen.getByText('Reload')).toBeDefined();
    });

    it('should render custom fallback', () => {
      render(
        <GenericErrorBoundary fallback={<div>Custom error view</div>}>
          <ThrowingComponent error={new Error('error')} />
        </GenericErrorBoundary>
      );

      expect(screen.getByText('Custom error view')).toBeDefined();
    });
  });
});
