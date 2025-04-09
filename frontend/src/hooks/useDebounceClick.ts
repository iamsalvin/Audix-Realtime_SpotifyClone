import { useCallback, useRef } from "react";

/**
 * Custom hook for debouncing button clicks to prevent rapid multiple clicks.
 * Similar to the implementation in PlaybackControls but reusable across components.
 *
 * @param callback The function to call when the button is clicked
 * @param delay The debounce delay in milliseconds
 * @param threshold The minimum time between clicks in milliseconds
 * @returns A function to use as the onClick handler
 */
export function useDebounceClick<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 200,
  threshold: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickRef = useRef<number>(0);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      // Prevent rapid clicks
      if (now - lastClickRef.current < threshold) {
        return;
      }

      // Update last click time
      lastClickRef.current = now;

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay, threshold]
  );

  return debouncedCallback;
}
