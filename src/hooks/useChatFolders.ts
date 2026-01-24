import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChatFolder {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  session_count?: number;
}

export function useChatFolders() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all folders for user
  const fetchFolders = useCallback(async () => {
    if (!user) {
      setFolders([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('chat_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setFolders(data || []);
    } catch (err) {
      console.error('Error fetching chat folders:', err);
      setError('Không thể tải danh sách thư mục');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Create a new folder
  const createFolder = useCallback(async (name: string, description?: string, color?: string, icon?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_folders')
        .insert({
          user_id: user.id,
          name,
          description,
          color: color || '#FFB800',
          icon: icon || 'folder',
        })
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating folder:', err);
      return null;
    }
  }, [user]);

  // Update folder
  const updateFolder = useCallback(async (folderId: string, updates: { name?: string; description?: string; color?: string; icon?: string }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('chat_folders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      setFolders(prev => prev.map(f => 
        f.id === folderId ? { ...f, ...updates, updated_at: new Date().toISOString() } : f
      ));

      return true;
    } catch (err) {
      console.error('Error updating folder:', err);
      return false;
    }
  }, [user]);

  // Delete folder
  const deleteFolder = useCallback(async (folderId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('chat_folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      setFolders(prev => prev.filter(f => f.id !== folderId));
      return true;
    } catch (err) {
      console.error('Error deleting folder:', err);
      return false;
    }
  }, [user]);

  // Get sessions in a folder
  const getSessionsInFolder = useCallback(async (folderId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('session_id')
        .eq('folder_id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Get unique session IDs
      const sessionIds = [...new Set(data?.map(d => d.session_id).filter(Boolean))];
      
      if (sessionIds.length === 0) return [];

      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .in('id', sessionIds)
        .order('last_message_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      return sessions || [];
    } catch (err) {
      console.error('Error getting sessions in folder:', err);
      return [];
    }
  }, [user]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return {
    folders,
    isLoading,
    error,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    getSessionsInFolder,
  };
}
