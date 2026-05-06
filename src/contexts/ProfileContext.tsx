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
    let mounted = true;

    // Safety timeout: if after 10 seconds we are still loading, force it to false
    // This prevents the "Synchronizing Identity" hang in production if Supabase is unreachable
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Identity synchronization timed out. Forcing loading to false.');
        setLoading(false);
      }
    }, 10000);

    const initSession = async () => {
      try {
        // Defensive check for missing environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.error('Supabase credentials missing. Check your environment variables.');
          if (mounted) setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session retrieval error:', error);
        }
        
        const currentUser = data?.session?.user ?? null;
        if (mounted) {
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile(currentUser.id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Critical session init error:', err);
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      if (mounted) {
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      authListener?.subscription.unsubscribe();
    };
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
          console.warn('Profile not found, attempting lazy creation...');
          // Attempt to create profile from auth metadata if trigger failed
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                full_name: user.user_metadata.full_name || 'Anonymous',
                role: user.user_metadata.role || 'member',
                employee_id: user.user_metadata.employee_id || 'UNKNOWN',
                skills: []
              })
              .select()
              .single();
            
            if (createError) {
              console.error('Lazy profile creation failed:', createError);
            } else if (newProfile) {
              setProfile({
                id: newProfile.id,
                employeeId: newProfile.employee_id,
                name: newProfile.full_name,
                role: newProfile.role,
                skills: newProfile.skills || [],
                totalLogs: 0
              });
            }
          }
        } else {
          toast.error(`Database error: ${error.message}`);
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
    window.location.href = '/login'; // Force clear state and redirect
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
