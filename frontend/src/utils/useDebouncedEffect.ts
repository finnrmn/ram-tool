import { DependencyList, EffectCallback, useEffect, useRef } from "react";

export const useDebouncedEffect = (effect: EffectCallback, deps: DependencyList, delay: number) => {
  const cleanupRef = useRef<void | (() => void)>();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      cleanupRef.current?.();
      cleanupRef.current = effect() ?? undefined;
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
};
