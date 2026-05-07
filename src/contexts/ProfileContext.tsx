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
  isOnline: boolean;
  connectionError: 'offline' | 'slow' | null;
  updateSkills: (newSkills: string[]) => Promise<void>;
  signOut: () => Promise<void>;
  fetchAllProfiles: () => Promise<any[]>;
  addMemberToLead: (employeeId: string) => Promise<boolean>;
  fetchManagerStats: () => Promise<any>;
}

export const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionError, setConnectionError] = useState<'offline' | 'slow' | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleOnline = () => {
      setIsOnline(true);
      setConnectionError(null);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionError('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (!navigator.onLine) handleOffline();

    const initSession = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.error('Team Tracker: Configuration Missing. Verify environment variables.');
          if (mounted) setLoading(false);
          return;
        }

        // Try to get session with a timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timeout')), 20000)
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) setLoading(false);
          return;
        }
        
        const currentUser = session?.user ?? null;
        if (mounted) {
          setUser(currentUser);
          if (currentUser) {
            // If user exists, fetch their profile
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

              if (profileError) {
                console.warn('Profile sync warning:', profileError.message, profileError.status);
                if (profileError.code === 'PGRST116' || profileError.status === 406 || profileError.status === 403 || profileError.status === 401) {
                  // If profile is missing or forbidden, attempt to recover or lazy-create
                  await fetchProfile(currentUser.id);
                } else {
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
            } catch (err) {
              console.error('Profile fetch internal error:', err);
              setLoading(false);
            }
          } else {
            // No user, no wait
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Team Tracker: Auth initialization failed.', err);
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Team Tracker Auth Event:', event);
      const currentUser = session?.user ?? null;
      
      if (mounted) {
        setUser(currentUser);
        if (currentUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
          if (!profile || profile.id !== currentUser.id) {
            await fetchProfile(currentUser.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
          if (typeof window !== 'undefined') window.location.replace('/login');
        } else if (!currentUser) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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

      if (error && (error.code === 'PGRST116' || error.status === 403 || error.status === 406)) {
        console.log('Profile missing or inaccessible, attempting recovery...');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profileToInsert = {
            id: user.id,
            full_name: user.user_metadata.full_name || 'Anonymous User',
            role: user.user_metadata.role || 'member',
            employee_id: user.user_metadata.employee_id || 'UNKNOWN',
            skills: []
          };

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(profileToInsert)
            .select()
            .single();
          
          if (insertError) {
            console.error('Profile recovery failed:', insertError);
            // If insert also fails with 403, it's definitely RLS
            if (insertError.status === 403) {
              toast.error('Database access denied. Please check RLS policies.');
            }
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
      } else if (error) {
        console.error('Profile fetch error:', error);
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
    if (!profile || (profile.role !== 'lead' && profile.role !== 'manager')) return [];
    
    let query = supabase.from('profiles').select('*');
    
    if (profile.role === 'lead') {
      // Leads only see members assigned to them
      query = query.eq('lead_id', profile.id);
    }
    
    const { data, error } = await query.order('full_name');
    
    if (error) {
      toast.error('Failed to fetch team profiles');
      return [];
    }
    return data || [];
  };

  const addMemberToLead = async (employeeId: string): Promise<boolean> => {
    if (!profile || profile.role !== 'lead') return false;

    try {
      // 1. Find the member by employee ID
      const { data: member, error: findError } = await supabase
        .from('profiles')
        .select('id, lead_id')
        .eq('employee_id', employeeId)
        .single();

      if (findError || !member) {
        toast.error('Member not found with this ID');
        return false;
      }

      if (member.lead_id) {
        toast.error('Member is already assigned to a lead');
        return false;
      }

      // 2. Assign lead_id to this profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ lead_id: profile.id })
        .eq('id', member.id);

      if (updateError) {
        toast.error('Failed to add member to group');
        return false;
      }

      toast.success('Member added successfully');
      return true;
    } catch (err) {
      console.error('Add member error:', err);
      return false;
    }
  };

  const fetchManagerStats = async () => {
    if (!profile || profile.role !== 'manager') return null;

    try {
      const { data: leads, error: leadsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'lead');

      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'member');

      if (leadsError || membersError) throw new Error('Failed to fetch stats');

      return {
        leads: leads || [],
        members: members || []
      };
    } catch (err) {
      toast.error('Failed to fetch manager intelligence');
      return null;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    window.location.replace('/login'); // Force clear state and history
  };

  return (
    <ProfileContext.Provider value={{ 
      profile, user, loading, isOnline, connectionError, 
      updateSkills, signOut, fetchAllProfiles, addMemberToLead, fetchManagerStats 
    }}>
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
