import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { View } from 'react-native';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/types';

/**
 * Ensures a profiles row exists for the authenticated user.
 * Handles the case where the DB trigger was installed after the user signed up.
 */
async function ensureProfile(session: Session): Promise<Profile | null> {
  const userId = session.user.id;

  // 1. Try to fetch existing profile
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existing) return existing as Profile;

  // 2. Profile missing — create it from auth metadata
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: session.user.email!,
      full_name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
    } as any)
    .select('*')
    .single();

  if (insertError) {
    console.error('[AuthProvider] Failed to create profile:', insertError.message);
    return null;
  }

  return inserted as Profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, isAuthenticated, isLoading, setSession, setUser, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 1. Fetch initial session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          const profile = await ensureProfile(session);
          setUser(profile);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };
    initSession();

    // 2. Listen to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        const profile = await ensureProfile(session);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 3. Route Guard
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!isAuthenticated && inAppGroup) {
      // Redirect to login if unauthenticated and trying to access private route
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated && (inAuthGroup || !segments.length)) {
      // Redirect to dashboard if authenticated and trying to access auth/public route
      router.replace('/(app)/dashboard' as any);
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFDF8' }}>
        <LoadingSpinner fullScreen />
      </View>
    );
  }

  return <>{children}</>;
}
