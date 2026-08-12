import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Hook to manage async operations with loading and error state.
 * Useful for one-off async operations that don't require TanStack Query.
 */
export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setState({ data: null, error: null, isLoading: true });
    try {
      const data = await asyncFn();
      setState({ data, error: null, isLoading: false });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ data: null, error, isLoading: false });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return { ...state, execute, reset };
}
