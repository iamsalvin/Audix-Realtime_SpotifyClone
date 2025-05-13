import { useEffect, useRef } from "react";

/**
 * Custom hook for setting up intervals that are properly cleaned up
 * when the component unmounts or when dependencies change.
 *
 * @param callback The function to call at each interval
 * @param delay Delay in milliseconds between each call (null to pause)
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>(() => {});

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    // Only set up interval if delay is not null
    if (delay !== null) {
      const id = setInterval(tick, delay);

      // Clear interval on cleanup
      return () => clearInterval(id);
    }

    // No cleanup needed if delay is null (paused)
    return undefined;
  }, [delay]);
}
