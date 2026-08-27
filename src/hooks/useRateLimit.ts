import { useRef, useCallback } from 'react';

interface RateLimitConfig {
  maxAttempts?: number;
  timeWindowMs?: number;
}

/**
 * Custom hook to enforce client-side rate limiting on sensitive form actions.
 * Defaults: Max 3 attempts per 60 seconds.
 */
export function useRateLimit(config: RateLimitConfig = {}) {
  const { maxAttempts = 3, timeWindowMs = 60000 } = config;
  const attemptsRef = useRef<number[]>([]);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    // Filter attempts within current time window
    attemptsRef.current = attemptsRef.current.filter(
      timestamp => now - timestamp < timeWindowMs
    );

    if (attemptsRef.current.length >= maxAttempts) {
      return false; // Rate limit exceeded
    }

    attemptsRef.current.push(now);
    return true; // Allowed
  }, [maxAttempts, timeWindowMs]);

  return { checkRateLimit };
}
