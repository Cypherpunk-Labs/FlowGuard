export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options?: { immediate?: boolean }
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime = 0;

  const immediate = options?.immediate ?? false;

  const clear = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const wrappedFn = (...args: Parameters<T>) => {
    lastArgs = args;
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (immediate && timeoutId === null) {
      lastCallTime = now;
      fn(...args);
    } else if (timeoutId !== null && timeSinceLastCall >= delay) {
      clear();
      lastCallTime = now;
      fn(...args);
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        if (lastArgs !== null) {
          fn(...lastArgs);
        }
        timeoutId = null;
        lastCallTime = Date.now();
      }, Math.max(0, delay - timeSinceLastCall));
    }
  };

  (wrappedFn as any).cancel = () => {
    clear();
    timeoutId = null;
    lastArgs = null;
  };

  (wrappedFn as any).flush = () => {
    if (timeoutId !== null && lastArgs !== null) {
      clear();
      fn(...lastArgs);
      lastCallTime = Date.now();
    }
  };

  return wrappedFn as T;
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  const wrappedFn = (...args: Parameters<T>) => {
    if (!inThrottle) {
      inThrottle = true;
      fn(...args);
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs !== null) {
          fn(...lastArgs);
          lastArgs = null;
          inThrottle = true;
          setTimeout(() => {
            inThrottle = false;
          }, limit);
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };

  (wrappedFn as any).cancel = () => {
    inThrottle = false;
    lastArgs = null;
  };

  return wrappedFn as T;
}
