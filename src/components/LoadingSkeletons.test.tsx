/**
 * Unit tests for LoadingSkeletons components
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import {
  ControllerHealthSkeleton,
  SealedSecretDetailSkeleton,
  SealedSecretListSkeleton,
  SealingKeysListSkeleton,
} from './LoadingSkeletons';

describe('LoadingSkeletons', () => {
  it('should render SealedSecretListSkeleton without errors', () => {
    const { container } = render(<SealedSecretListSkeleton />);
    expect(container.querySelector('.MuiSkeleton-root')).toBeTruthy();
  });

  it('should render SealedSecretDetailSkeleton without errors', () => {
    const { container } = render(<SealedSecretDetailSkeleton />);
    expect(container.querySelector('.MuiSkeleton-root')).toBeTruthy();
  });

  it('should render SealingKeysListSkeleton without errors', () => {
    const { container } = render(<SealingKeysListSkeleton />);
    expect(container.querySelector('.MuiSkeleton-root')).toBeTruthy();
  });

  it('should render ControllerHealthSkeleton without errors', () => {
    const { container } = render(<ControllerHealthSkeleton />);
    expect(container.querySelector('.MuiSkeleton-root')).toBeTruthy();
  });

  it('should render list skeleton with multiple rows', () => {
    const { container } = render(<SealedSecretListSkeleton />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBe(5);
  });

  it('should render detail skeleton with multiple sections', () => {
    const { container } = render(<SealedSecretDetailSkeleton />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });
});
