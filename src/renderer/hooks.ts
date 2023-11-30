import { DependencyList, useEffect } from 'react';

// eslint-disable-next-line import/prefer-default-export
export function useCancellableEffect(
  effect: (isCancelled: () => boolean) => any,
  deps?: DependencyList,
) {
  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    const cleanup = effect(isCancelled);
    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
