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
        if (error.code !== 'PGRST116') {
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
      const userProfile = await fetchUserProfile(authUser.id);
      if (userProfile) {
        setUser(userProfile);
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
          console.error('AuthContext: Error getting session:', error);
        }
        
        if (session?.user) {
          setAuthUser(session.user);
          const userProfile = await fetchUserProfile(session.user.id);
          if (userProfile) {
            setUser(userProfile);
          }
        }
      } catch (error) {
        console.error('AuthContext: Exception getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state change event:', event, session?.user?.id);
        
        if (session?.user) {
          setAuthUser(session.user);
          
          // Add a small delay for all auth events to ensure database consistency
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const userProfile = await fetchUserProfile(session.user.id);
          if (userProfile) {
            setUser(userProfile);
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
      const { data, error } = await authHelpers.signInWithEmail(email, password);
      
      if (error) {
        console.error('SignIn: Error during sign in:', error);
        return { error };
      }

      if (data.user) {
        setAuthUser(data.user);
        const userProfile = await fetchUserProfile(data.user.id);
        if (userProfile) {
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
      const { data, error } = await authHelpers.signUp(email, password, metadata);
      
      if (error) {
        console.error('SignUp: Error during sign up:', error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('SignUp: Exception during sign up:', error);
      return { error };
    }
  };

  const signOut = async () => {
    // Prevent multiple simultaneous sign out attempts
    if (isSigningOut) {
      return;
    }

    try {
      setIsSigningOut(true);
      const result = await authHelpers.signOut();
      
      if (result.error) {
        console.error('SignOut: Error from authHelpers:', result.error);
        setIsSigningOut(false);
        return;
      }
      
      setAuthUser(null);
      setUser(null);
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