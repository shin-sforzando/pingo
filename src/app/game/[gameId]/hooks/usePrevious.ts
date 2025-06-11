import { useEffect, useRef } from "react";

/**
 * Hook to track previous value of a state or prop
 * Essential for detecting state changes in React functional components
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}
