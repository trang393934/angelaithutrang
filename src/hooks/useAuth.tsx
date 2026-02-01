import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAdminChecked: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache admin status to prevent repeated checks
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminChecked, setIsAdminChecked] = useState(false);

  // Clear ONLY local persisted auth state without network calls.
  // This prevents infinite refresh-token loops when the stored session becomes invalid/corrupted.
  const clearLocalSession = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // ignore
    }
  }, []);

  const checkAdminRole = useCallback(async (userId: string): Promise<boolean> => {
    // Check cache first
    const cached = adminCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.isAdmin;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      
      const adminStatus = !!data;
      
      // Cache the result
      adminCache.set(userId, { isAdmin: adminStatus, timestamp: Date.now() });
      
      return adminStatus;
    } catch (error) {
      console.error("Error checking admin role:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes (does NOT control isLoading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        // Fire and forget - don't await, don't set loading
        if (session?.user) {
          checkAdminRole(session.user.id).then(adminStatus => {
            if (isMounted) {
              setIsAdmin(adminStatus);
              setIsAdminChecked(true);
            }
          });
        } else {
          setIsAdmin(false);
          setIsAdminChecked(true);
        }
      }
    );

    // INITIAL load (controls isLoading)
    const initializeAuth = async () => {
      try {
        // Explicitly get session for initial load
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // Fetch role BEFORE setting loading false
        if (initialSession?.user) {
          const adminStatus = await checkAdminRole(initialSession.user.id);
          if (isMounted) {
            setIsAdmin(adminStatus);
            setIsAdminChecked(true);
          }
        } else {
          if (isMounted) {
            setIsAdminChecked(true);
          }
        }
      } catch (error) {
        console.error("Error during initial auth setup:", error);

        // If auth initialization fails (often due to a broken/expired persisted refresh token),
        // clear local session so the app can recover and allow user to sign in again.
        await clearLocalSession();

        if (isMounted) {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsAdminChecked(true);
        }
      } finally {
        // Only set loading to false after initial checks are done or failed
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminRole, clearLocalSession]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setIsAdminChecked(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      setIsAdminChecked(true);
    }
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Clear cache on sign out
    if (user) {
      adminCache.delete(user.id);
    }
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsAdminChecked(true);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      isAdmin, 
      isAdminChecked,
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
