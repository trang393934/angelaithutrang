import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// localStorage key for persisting last session ID
const LAST_SESSION_KEY = 'angel_ai_last_session_id';

// Helper functions for localStorage persistence
const saveLastSessionId = (sessionId: string | null) => {
  if (sessionId) {
    localStorage.setItem(LAST_SESSION_KEY, sessionId);
  } else {
    localStorage.removeItem(LAST_SESSION_KEY);
  }
};

const getLastSessionId = (): string | null => {
  return localStorage.getItem(LAST_SESSION_KEY);
};

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  folder_id?: string | null;
  message_count?: number;
}

export interface ChatMessage {
  id: string;
  question_text: string;
  answer_text: string;
  purity_score: number | null;
  reward_amount: number;
  is_rewarded: boolean;
  created_at: string;
  session_id: string | null;
}

export function useChatSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const hasRestoredSession = useRef(false);

  // Fetch all sessions for user with retry logic
  const fetchSessions = useCallback(async (retryCount = 0) => {
    if (!user) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const { data, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (fetchError) throw fetchError;

      setSessions(data || []);
    } catch (err: any) {
      console.error('Error fetching chat sessions:', err);
      
      // Retry once after 3 seconds if first attempt
      if (retryCount < 1 && (err.name === 'AbortError' || err.message?.includes('timeout'))) {
        console.log('Retrying fetch sessions...');
        setTimeout(() => fetchSessions(retryCount + 1), 3000);
        return;
      }
      
      setError('Không thể tải danh sách cuộc trò chuyện');
      setSessions([]); // Fallback: allow new chat
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch messages for a specific session
  const fetchSessionMessages = useCallback(async (sessionId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setSessionMessages(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching session messages:', err);
      return [];
    }
  }, [user]);

  // Create a new session
  const createSession = useCallback(async (title: string = 'Cuộc trò chuyện mới', description?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title,
          description,
        })
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => [data, ...prev]);
      setCurrentSession(data);
      setSessionMessages([]);
      return data;
    } catch (err) {
      console.error('Error creating session:', err);
      return null;
    }
  }, [user]);

  // Update session title/description
  const updateSession = useCallback(async (sessionId: string, updates: { title?: string; description?: string; folder_id?: string | null }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
      ));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, ...updates } : null);
      }

      return true;
    } catch (err) {
      console.error('Error updating session:', err);
      return false;
    }
  }, [user, currentSession]);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setSessionMessages([]);
      }

      return true;
    } catch (err) {
      console.error('Error deleting session:', err);
      return false;
    }
  }, [user, currentSession]);

  // Select a session and persist to localStorage
  const selectSession = useCallback(async (session: ChatSession | null) => {
    setCurrentSession(session);
    saveLastSessionId(session?.id || null); // Persist to localStorage
    if (session) {
      await fetchSessionMessages(session.id);
    } else {
      setSessionMessages([]);
    }
  }, [fetchSessionMessages]);

  // End current session and clear localStorage
  const endCurrentSession = useCallback(async () => {
    if (currentSession) {
      await updateSession(currentSession.id, { title: currentSession.title });
    }
    setCurrentSession(null);
    setSessionMessages([]);
    saveLastSessionId(null); // Clear localStorage when starting new session
  }, [currentSession, updateSession]);

  // Clear session from localStorage when it's deleted
  const deleteSessionWithPersist = useCallback(async (sessionId: string) => {
    const result = await deleteSession(sessionId);
    // If deleted session was the persisted one, clear localStorage
    if (result && getLastSessionId() === sessionId) {
      saveLastSessionId(null);
    }
    return result;
  }, [deleteSession]);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Restore last session from localStorage after sessions are loaded
  useEffect(() => {
    const restoreLastSession = async () => {
      // Only restore once per mount, and only when sessions are loaded
      if (hasRestoredSession.current || isLoading || !user) return;
      
      const lastSessionId = getLastSessionId();
      if (!lastSessionId) {
        hasRestoredSession.current = true;
        return;
      }

      // Find session in loaded sessions
      const lastSession = sessions.find(s => s.id === lastSessionId);
      if (lastSession) {
        setIsRestoringSession(true);
        await selectSession(lastSession);
        setIsRestoringSession(false);
      } else {
        // Session was deleted, clear localStorage
        saveLastSessionId(null);
      }
      
      hasRestoredSession.current = true;
    };

    restoreLastSession();
  }, [user, sessions, isLoading, selectSession]);

  // Reset restoration flag when user changes (logout/login)
  useEffect(() => {
    hasRestoredSession.current = false;
  }, [user?.id]);

  // Clear localStorage when user logs out
  useEffect(() => {
    if (!user) {
      saveLastSessionId(null);
    }
  }, [user]);

  return {
    sessions,
    currentSession,
    sessionMessages,
    isLoading,
    isRestoringSession,
    error,
    fetchSessions,
    fetchSessionMessages,
    createSession,
    updateSession,
    deleteSession: deleteSessionWithPersist, // Use wrapped version
    selectSession,
    endCurrentSession,
    setCurrentSession,
  };
}
