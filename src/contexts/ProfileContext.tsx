'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '@/types/profile';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface ProfileContextType {
  profile: UserProfile | null;
  user: User | null;
  loading: boolean;
  updateSkills: (newSkills: string[]) => Promise<void>;
  signOut: () => Promise<void>;
  fetchAllProfiles: () => Promise<any[]>;
}

export const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Session init error:', err);
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('Profile not found, trigger might be delayed or missing.');
        } else {
          toast.error(`Database error: ${error.message}. Please ensure SQL schema is executed.`);
        }
      }

      if (data) {
        setProfile({
          id: data.id,
          employeeId: data.employee_id || 'UNKNOWN',
          name: data.full_name || 'Anonymous',
          role: data.role || 'member',
          skills: data.skills || [],
          totalLogs: 0
        });
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSkills = async (newSkills: string[]) => {
    if (!profile || !user) return;

    const updatedSkills = [...profile.skills];
    newSkills.forEach(s => {
      const existingIndex = updatedSkills.findIndex(sk => sk.name.toLowerCase() === s.toLowerCase());
      if (existingIndex > -1) {
        updatedSkills[existingIndex] = {
          ...updatedSkills[existingIndex],
          count: updatedSkills[existingIndex].count + 1,
          lastUsed: new Date().toISOString()
        };
      } else {
        updatedSkills.push({
          name: s,
          count: 1,
          lastUsed: new Date().toISOString()
        });
      }
    });

    const { error } = await supabase
      .from('profiles')
      .update({ skills: updatedSkills })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to sync skills to database');
    } else {
      setProfile(prev => prev ? { ...prev, skills: updatedSkills } : null);
    }
  };

  const fetchAllProfiles = async () => {
    if (profile?.role !== 'lead') return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'member')
      .order('full_name');
    
    if (error) {
      toast.error('Failed to fetch team profiles');
      return [];
    }
    return data || [];
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
  };

  return (
    <ProfileContext.Provider value={{ profile, user, loading, updateSkills, signOut, fetchAllProfiles }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
