import { supabase } from '@/lib/supabase';

/**
 * Base service class providing common Supabase operations.
 * Feature services should extend this or use supabase client directly.
 */
export class BaseService {
  protected supabase = supabase;

  /**
   * Handles Supabase errors uniformly
   */
  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      throw error;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      throw new Error((error as { message: string }).message);
    }
    throw new Error('An unexpected error occurred');
  }
}
