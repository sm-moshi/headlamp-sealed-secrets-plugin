/**
 * Test setup for Vitest
 *
 * Provides global mocks and utilities for testing
 */

import { beforeAll } from 'vitest';

// Mock localStorage for tests
const localStorageMock = {
  getItem: () => {
    return null;
  },
  setItem: () => {
    //noop
  },
  removeItem: () => {
    // noop
  },
  clear: () => {
    // noop
  },
};

beforeAll(() => {
  global.localStorage = localStorageMock as any;
});
