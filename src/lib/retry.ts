/**
 * Retry logic with exponential backoff
 *
 * Provides utilities for retrying failed operations with configurable
 * backoff strategies and error handling.
 */

import { AsyncResult, Err } from '../types';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelayMs?: number;
  /** Backoff multiplier (default: 2 for exponential) */
  backoffMultiplier?: number;
  /** Whether to add jitter to delays (default: true) */
  useJitter?: boolean;
  /** Predicate to determine if error is retryable (default: all errors retryable) */
  isRetryable?: (error: Error) => boolean;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  useJitter: true,
  isRetryable: () => true, // All errors retryable by default
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and optional jitter
 *
 * @param attempt Current attempt number (0-indexed)
 * @param options Retry options
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const { initialDelayMs, maxDelayMs, backoffMultiplier, useJitter } = options;

  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  let delay = initialDelayMs * Math.pow(backoffMultiplier, attempt);

  // Cap at max delay
  delay = Math.min(delay, maxDelayMs);

  // Add jitter (±25% random variation)
  if (useJitter) {
    const jitterRange = delay * 0.25;
    const jitter = Math.random() * jitterRange * 2 - jitterRange;
    delay = Math.max(0, delay + jitter);
  }

  return Math.floor(delay);
}

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation Async operation to retry (should return AsyncResult)
 * @param options Retry configuration
 * @returns Result of the operation or final error after all retries
 *
 * @example
 * const result = await retryWithBackoff(
 *   async () => fetchPublicCertificate(config),
 *   { maxAttempts: 3, initialDelayMs: 1000 }
 * );
 */
export async function retryWithBackoff<T, E>(
  operation: () => AsyncResult<T, E>,
  options: RetryOptions = {}
): AsyncResult<T, string> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const errors: string[] = [];

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      const result = await operation();

      // If operation succeeded, return immediately
      if (result.ok) {
        return result;
      }

      // Operation returned an error - use explicit check for type narrowing
      if (result.ok === false) {
        const errorMessage = typeof result.error === 'string' ? result.error : String(result.error);
        errors.push(`Attempt ${attempt + 1}: ${errorMessage}`);
      }

      // Check if we should retry
      const isLastAttempt = attempt === opts.maxAttempts - 1;
      if (isLastAttempt) {
        // No more retries, return final error
        return Err(`Operation failed after ${opts.maxAttempts} attempts:\n${errors.join('\n')}`);
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
    } catch (error) {
      // Unexpected exception (shouldn't happen with AsyncResult, but handle it)
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Attempt ${attempt + 1}: ${errorMessage}`);

      const isLastAttempt = attempt === opts.maxAttempts - 1;
      if (isLastAttempt) {
        return Err(`Operation failed after ${opts.maxAttempts} attempts:\n${errors.join('\n')}`);
      }

      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs it
  return Err(`Operation failed after ${opts.maxAttempts} attempts:\n${errors.join('\n')}`);
}
