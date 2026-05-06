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
        console.warn('Lumina Sync: Connection latency detected. Forcing fallback.');
        setLoading(false);
      }
    }, 5000);

    const initSession = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.error('Lumina Sync: Critical configuration failure. Missing Supabase keys.');
          if (mounted) setLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const currentUser = session?.user ?? null;
        if (mounted) {
          setUser(currentUser);
          if (currentUser) {
            // If user exists, fetch their profile immediately
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();

            if (profileError) {
              if (profileError.code === 'PGRST116') {
                await fetchProfile(currentUser.id); // Attempt lazy creation
              } else {
                console.error('Profile sync error:', profileError.message);
                setLoading(false);
              }
            } else if (profileData) {
              setProfile({
                id: profileData.id,
                employeeId: profileData.employee_id || 'UNKNOWN',
                name: profileData.full_name || 'Anonymous',
                role: profileData.role || 'member',
                skills: profileData.skills || [],
                totalLogs: 0
              });
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Lumina Sync: Authentication cycle failed.', err);
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      if (mounted) {
        setUser(currentUser);
        if (currentUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          setProfile(null); // Clear any stale profile data during transition
          await fetchProfile(currentUser.id);
        } else if (event === 'SIGNED_OUT') {
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

      if (error && error.code === 'PGRST116') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata.full_name || 'Anonymous User',
              role: user.user_metadata.role || 'member',
              employee_id: user.user_metadata.employee_id || 'UNKNOWN',
              skills: []
            })
            .select()
            .single();
          
          if (newProfile) {
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
      } else if (data) {
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
      console.error('Profile retrieval failed:', err);
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
    window.location.replace('/login'); // Force clear state and history
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
