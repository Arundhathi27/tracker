import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query client configured for production use.
 * - Disables retries on 4xx errors (auth/validation failures)
 * - 5-minute stale time to reduce unnecessary refetches
 * - 10-minute garbage collection window
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        if (
          error instanceof Error &&
          'status' in error &&
          typeof (error as { status: number }).status === 'number' &&
          (error as { status: number }).status >= 400 &&
          (error as { status: number }).status < 500
        ) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
