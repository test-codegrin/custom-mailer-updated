// src/contexts/SupabaseAuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '../components/ui/use-toast';
import { supabase } from '../lib/supabaseClient'; // <- import client from new module

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback((session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        // data.session might be undefined if not signed in
        if (!mounted) return;
        handleSession(data?.session ?? null);
      } catch (err) {
        console.error('Error getting session:', err);
        if (mounted) setLoading(false);
      }
    };

    getSession();

    // subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      mounted = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({ email, password, options });
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }
    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    }
    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }
    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
