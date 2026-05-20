'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WorkLog } from '@/types/log';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface LogContextType {
  logs: WorkLog[];
  addLog: (log: any) => Promise<string | null>;
  getLogsByDate: (date: string) => WorkLog[];
  fetchAllMembersLogs: () => Promise<WorkLog[]>;
  loading: boolean;
  fetchLogsForUser: (userId: string) => Promise<WorkLog[]>;
}

export const LogContext = createContext<LogContextType | null>(null);

export function LogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useProfile();

  useEffect(() => {
    if (user) {
      fetchUserLogs();
    } else {
      setLogs([]);
      setLoading(false);
    }
  }, [user]);

  const fetchUserLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Logs fetch error:', error);
      }

      if (data) {
        const formattedLogs: WorkLog[] = data.map(l => ({
          id: l.id,
          date: l.date,
          content: l.content,
          skills: l.skills || [],
          learnings: l.learnings || [],
          createdAt: new Date(l.created_at).getTime()
        }));
        setLogs(formattedLogs);
      }
    } catch (err) {
      console.error('Fetch logs exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const addLog = async (logData: any): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('logs')
        .insert({
          user_id: user.id,
          content: logData.content,
          date: logData.date,
          skills: logData.skills,
          learnings: logData.learnings,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        toast.error(`Audit failed to commit: ${error.message}`);
        return null;
      }

      if (data) {
        const newLog: WorkLog = {
          id: data.id,
          date: data.date,
          content: data.content,
          skills: data.skills || [],
          learnings: data.learnings || [],
          createdAt: new Date(data.created_at).getTime()
        };
        setLogs(prev => [newLog, ...prev]);
        return data.id;
      }
      return null;
    } catch (err) {
      console.error('Add log exception:', err);
      toast.error('System error while committing audit');
      return null;
    }
  };

  const fetchAllMembersLogs = async () => {
    if (profile?.role !== 'lead') return [];
    
    try {
      // Try to join with profiles and filter by role
      const { data, error } = await supabase
        .from('logs')
        .select('*, profiles!inner(full_name, role)')
        .eq('profiles.role', 'member')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Joint fetch failed or filtered out everything, falling back to separate fetches:', error.message);
        // Fallback: Fetch logs and member profiles separately
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('role', 'member');

        if (profilesError) throw profilesError;
        
        const memberIds = profiles?.map(p => p.id) || [];
        
        const { data: simpleLogs, error: logsError } = await supabase
          .from('logs')
          .select('*')
          .in('user_id', memberIds)
          .order('created_at', { ascending: false });
        
        if (logsError) throw logsError;

        return (simpleLogs || []).map(l => ({
          ...l,
          userName: profiles?.find(p => p.id === l.user_id)?.full_name || 'Unknown Member',
          createdAt: new Date(l.created_at).getTime()
        }));
      }

      if (data) {
        return data.map(l => ({
          ...l,
          userName: (l.profiles as any)?.full_name || 'Unknown Member',
          createdAt: new Date(l.created_at).getTime()
        }));
      }
    } catch (err) {
      console.error('Lead fetch exception:', err);
      toast.error('Team audit sync failed. Ensure SQL schema is applied.');
    }
    return [];
  };

  const fetchLogsForUser = async (userId: string): Promise<WorkLog[]> => {
    if (!profile || (profile.role !== 'manager' && profile.role !== 'lead' && profile.id !== userId)) return [];

    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(l => ({
        id: l.id,
        date: l.date,
        content: l.content,
        skills: l.skills || [],
        learnings: l.learnings || [],
        createdAt: new Date(l.created_at).getTime()
      }));
    } catch (err) {
      console.error('Fetch user logs error:', err);
      return [];
    }
  };

  const getLogsByDate = (date: string) => 
    logs.filter(l => l.date === date).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <LogContext.Provider value={{ logs, addLog, getLogsByDate, fetchAllMembersLogs, loading, fetchLogsForUser }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLogs() {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLogs must be used within a LogProvider');
  }
  return context;
}
