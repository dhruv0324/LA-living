'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, authHelpers } from '@/lib/supabase';

interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  authUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata: { name: string; username: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const fetchUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('User profile not found - this is normal for new accounts');
        } else {
          console.error('Error fetching user profile:', error);
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error || !authUser) {
        setAuthUser(null);
        setUser(null);
        return;
      }

      setAuthUser(authUser);
      
      // Fetch user profile from custom users table
      console.log('RefreshUser: Fetching profile for user:', authUser.id);
      const userProfile = await fetchUserProfile(authUser.id);
      if (userProfile) {
        console.log('RefreshUser: Profile fetched successfully:', userProfile.name);
        setUser(userProfile);
      } else {
        console.log('RefreshUser: No profile found for user:', authUser.id);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setAuthUser(null);
      setUser(null);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        if (session?.user) {
          setAuthUser(session.user);
          const userProfile = await fetchUserProfile(session.user.id);
          if (userProfile) {
            setUser(userProfile);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event, session?.user?.id);
        
        if (session?.user) {
          setAuthUser(session.user);
          
          // Only fetch profile for sign in events, not sign up
          if (event === 'SIGNED_IN') {
            console.log('User signed in, fetching profile...');
            const userProfile = await fetchUserProfile(session.user.id);
            if (userProfile) {
              setUser(userProfile);
            }
          }
        } else {
          setAuthUser(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('SignIn: Starting sign in process...');
      const { data, error } = await authHelpers.signInWithEmail(email, password);
      
      if (error) {
        console.error('SignIn: Error during sign in:', error);
        return { error };
      }

      if (data.user) {
        console.log('SignIn: Sign in successful, fetching user profile...');
        setAuthUser(data.user);
        const userProfile = await fetchUserProfile(data.user.id);
        if (userProfile) {
          console.log('SignIn: User profile fetched successfully:', userProfile.name);
          setUser(userProfile);
        } else {
          console.error('SignIn: Failed to fetch user profile');
        }
      }

      return { error: null };
    } catch (error) {
      console.error('SignIn: Exception during sign in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, metadata: { name: string; username: string }) => {
    try {
      console.log('SignUp: Starting sign up process...');
      const { data, error } = await authHelpers.signUp(email, password, metadata);
      
      if (error) {
        console.error('SignUp: Error during sign up:', error);
        return { error };
      }

      console.log('SignUp: Account created successfully');
      
      return { error: null };
    } catch (error) {
      console.error('SignUp: Exception during sign up:', error);
      return { error };
    }
  };

  const signOut = async () => {
    // Prevent multiple simultaneous sign out attempts
    if (isSigningOut) {
      console.log('SignOut: Already signing out, ignoring request');
      return;
    }

    try {
      setIsSigningOut(true);
      console.log('SignOut: Starting sign out process...');
      
      const result = await authHelpers.signOut();
      console.log('SignOut: authHelpers.signOut result:', result);
      
      if (result.error) {
        console.error('SignOut: Error from authHelpers:', result.error);
        setIsSigningOut(false);
        return;
      }
      
      console.log('SignOut: Successfully signed out from Supabase');
      setAuthUser(null);
      setUser(null);
      console.log('SignOut: Local state cleared, user should be null now');
    } catch (error) {
      console.error('SignOut: Exception during sign out:', error);
      setIsSigningOut(false);
    }
  };

  const value = {
    user,
    authUser,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext; 