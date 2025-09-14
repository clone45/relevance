'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  interval?: number; // Polling interval in milliseconds (default: 30000 = 30 seconds)
  enabled?: boolean; // Whether polling is enabled
  immediate?: boolean; // Whether to run the callback immediately
}

export function usePolling(
  callback: () => Promise<void> | void,
  options: UsePollingOptions = {}
) {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    immediate = false,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        await callbackRef.current();
      } catch (error) {
        console.error('Polling callback error:', error);
      }
    }, interval);
  }, [interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      if (immediate) {
        // Run immediately, then start polling
        callbackRef.current();
      }
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, immediate, startPolling, stopPolling]);

  // Handle page visibility changes to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (enabled) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, startPolling, stopPolling]);

  return { startPolling, stopPolling };
}