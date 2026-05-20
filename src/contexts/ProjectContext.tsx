'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, ProjectMember } from '@/types/project';
import { WorkLog } from '@/types/log';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  createProject: (data: { name: string; description?: string; startDate: string; endDate?: string }) => Promise<Project | null>;
  updateProject: (id: string, data: Partial<{ name: string; description: string; startDate: string; endDate: string; status: 'active' | 'completed' | 'archived' }>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMemberToProject: (projectId: string, employeeId: string, role?: string) => Promise<void>;
  removeMemberFromProject: (projectId: string, memberId: string) => Promise<void>;
  fetchProjectMembers: (projectId: string) => Promise<ProjectMember[]>;
  fetchProjectLogs: (projectId: string) => Promise<(WorkLog & { userName?: string })[]>;
  tagLogToProject: (logId: string, projectId: string) => Promise<void>;
  untagLogFromProject: (logId: string, projectId: string) => Promise<void>;
  fetchMyProjects: () => Promise<Project[]>;
  fetchAllProjects: () => Promise<Project[]>;
  fetchProjectById: (id: string) => Promise<Project | null>;
  refreshProjects: () => Promise<void>;
}

export const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useProfile();

  useEffect(() => {
    if (user && profile) {
      loadProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [user, profile]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      
      if (profile?.role === 'manager') {
        // Manager sees all projects
        const res = await supabase
          .from('projects')
          .select('*, profiles!projects_lead_id_fkey(full_name)')
          .order('created_at', { ascending: false });
        data = res.data || [];
      } else if (profile?.role === 'lead') {
        // Lead sees projects they created
        const res = await supabase
          .from('projects')
          .select('*, profiles!projects_lead_id_fkey(full_name)')
          .eq('lead_id', user?.id)
          .order('created_at', { ascending: false });
        data = res.data || [];
      } else {
        // Member sees projects they're assigned to
        const memberRes = await supabase
          .from('project_members')
          .select('project_id')
          .eq('member_id', user?.id);
        
        const projectIds = (memberRes.data || []).map(pm => pm.project_id);
        
        if (projectIds.length > 0) {
          const res = await supabase
            .from('projects')
            .select('*, profiles!projects_lead_id_fkey(full_name)')
            .in('id', projectIds)
            .order('created_at', { ascending: false });
          data = res.data || [];
        }
      }

      // Get member counts for each project
      const formatted: Project[] = await Promise.all(
        data.map(async (p: any) => {
          const { count } = await supabase
            .from('project_members')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', p.id);

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            leadId: p.lead_id,
            leadName: (p.profiles as any)?.full_name || 'Unknown',
            startDate: p.start_date,
            endDate: p.end_date,
            status: p.status,
            createdAt: p.created_at,
            memberCount: count || 0
          };
        })
      );

      setProjects(formatted);
    } catch (err) {
      console.error('Load projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProjects = async () => {
    await loadProjects();
  };

  const createProject = async (data: { name: string; description?: string; startDate: string; endDate?: string }): Promise<Project | null> => {
    if (!user || profile?.role !== 'lead') {
      toast.error('Only leads can create projects.');
      return null;
    }

    try {
      const { data: created, error } = await supabase
        .from('projects')
        .insert({
          name: data.name,
          description: data.description || null,
          lead_id: user.id,
          start_date: data.startDate,
          end_date: data.endDate || null,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        toast.error(`Failed to create project: ${error.message}`);
        return null;
      }

      if (created) {
        const newProject: Project = {
          id: created.id,
          name: created.name,
          description: created.description,
          leadId: created.lead_id,
          leadName: profile?.name || 'Unknown',
          startDate: created.start_date,
          endDate: created.end_date,
          status: created.status,
          createdAt: created.created_at,
          memberCount: 0
        };
        setProjects(prev => [newProject, ...prev]);
        toast.success('Project created successfully.');
        return newProject;
      }
    } catch (err) {
      console.error('Create project error:', err);
      toast.error('System error while creating project.');
    }
    return null;
  };

  const updateProject = async (id: string, data: Partial<{ name: string; description: string; startDate: string; endDate: string; status: 'active' | 'completed' | 'archived' }>) => {
    try {
      const updatePayload: any = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.startDate !== undefined) updatePayload.start_date = data.startDate;
      if (data.endDate !== undefined) updatePayload.end_date = data.endDate;
      if (data.status !== undefined) updatePayload.status = data.status;

      const { error } = await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        toast.error(`Failed to update project: ${error.message}`);
        return;
      }

      setProjects(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, ...data }
            : p
        )
      );
      toast.success('Project updated.');
    } catch (err) {
      console.error('Update project error:', err);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error(`Failed to delete project: ${error.message}`);
        return;
      }

      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Project deleted.');
    } catch (err) {
      console.error('Delete project error:', err);
    }
  };

  const addMemberToProject = async (projectId: string, employeeId: string, role: string = 'developer') => {
    try {
      // Find the member by employee_id
      const { data: memberProfile, error: findError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('employee_id', employeeId)
        .single();

      if (findError || !memberProfile) {
        toast.error(`No user found with ID: ${employeeId}`);
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('member_id', memberProfile.id)
        .maybeSingle();

      if (existing) {
        toast.info(`${memberProfile.full_name} is already in this project.`);
        return;
      }

      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          member_id: memberProfile.id,
          role: role,
          joined_at: new Date().toISOString().split('T')[0]
        });

      if (error) {
        toast.error(`Failed to add member: ${error.message}`);
        return;
      }

      // Update local member count
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? { ...p, memberCount: (p.memberCount || 0) + 1 }
            : p
        )
      );

      toast.success(`${memberProfile.full_name} added to project.`);
    } catch (err) {
      console.error('Add member error:', err);
      toast.error('System error while adding member.');
    }
  };

  const removeMemberFromProject = async (projectId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('member_id', memberId);

      if (error) {
        toast.error(`Failed to remove member: ${error.message}`);
        return;
      }

      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? { ...p, memberCount: Math.max((p.memberCount || 1) - 1, 0) }
            : p
        )
      );

      toast.success('Member removed from project.');
    } catch (err) {
      console.error('Remove member error:', err);
    }
  };

  const fetchProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('*, profiles!project_members_member_id_fkey(full_name, employee_id)')
        .eq('project_id', projectId)
        .order('joined_at', { ascending: true });

      if (error) {
        // Fallback: fetch without join
        const { data: membersRaw } = await supabase
          .from('project_members')
          .select('*')
          .eq('project_id', projectId);

        if (!membersRaw) return [];

        const memberIds = membersRaw.map(m => m.member_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, employee_id')
          .in('id', memberIds);

        return membersRaw.map(m => ({
          id: m.id,
          projectId: m.project_id,
          memberId: m.member_id,
          memberName: profiles?.find(p => p.id === m.member_id)?.full_name || 'Unknown',
          employeeId: profiles?.find(p => p.id === m.member_id)?.employee_id || '',
          role: m.role,
          joinedAt: m.joined_at,
          leftAt: m.left_at
        }));
      }

      return (data || []).map((m: any) => ({
        id: m.id,
        projectId: m.project_id,
        memberId: m.member_id,
        memberName: m.profiles?.full_name || 'Unknown',
        employeeId: m.profiles?.employee_id || '',
        role: m.role,
        joinedAt: m.joined_at,
        leftAt: m.left_at
      }));
    } catch (err) {
      console.error('Fetch project members error:', err);
      return [];
    }
  };

  const fetchProjectLogs = async (projectId: string): Promise<(WorkLog & { userName?: string })[]> => {
    try {
      // Get log IDs for this project
      const { data: projectLogLinks, error: linkError } = await supabase
        .from('project_logs')
        .select('log_id')
        .eq('project_id', projectId);

      if (linkError || !projectLogLinks || projectLogLinks.length === 0) return [];

      const logIds = projectLogLinks.map(pl => pl.log_id);

      // Fetch the actual logs with user info
      const { data: logsData, error: logsError } = await supabase
        .from('logs')
        .select('*, profiles!logs_user_id_fkey(full_name)')
        .in('id', logIds)
        .order('created_at', { ascending: false });

      if (logsError) {
        // Fallback without join
        const { data: plainLogs } = await supabase
          .from('logs')
          .select('*')
          .in('id', logIds)
          .order('created_at', { ascending: false });

        return (plainLogs || []).map(l => ({
          id: l.id,
          date: l.date,
          content: l.content,
          skills: l.skills || [],
          learnings: l.learnings || [],
          createdAt: new Date(l.created_at).getTime(),
          userName: 'Team Member'
        }));
      }

      return (logsData || []).map((l: any) => ({
        id: l.id,
        date: l.date,
        content: l.content,
        skills: l.skills || [],
        learnings: l.learnings || [],
        createdAt: new Date(l.created_at).getTime(),
        userName: l.profiles?.full_name || 'Team Member'
      }));
    } catch (err) {
      console.error('Fetch project logs error:', err);
      return [];
    }
  };

  const tagLogToProject = async (logId: string, projectId: string) => {
    try {
      const { error } = await supabase
        .from('project_logs')
        .insert({ project_id: projectId, log_id: logId });

      if (error) {
        if (error.code === '23505') {
          toast.info('Log is already tagged to this project.');
        } else {
          toast.error(`Failed to tag log: ${error.message}`);
        }
        return;
      }

      toast.success('Log tagged to project.');
    } catch (err) {
      console.error('Tag log error:', err);
    }
  };

  const untagLogFromProject = async (logId: string, projectId: string) => {
    try {
      const { error } = await supabase
        .from('project_logs')
        .delete()
        .eq('project_id', projectId)
        .eq('log_id', logId);

      if (error) {
        toast.error(`Failed to untag log: ${error.message}`);
        return;
      }
    } catch (err) {
      console.error('Untag log error:', err);
    }
  };

  const fetchMyProjects = async (): Promise<Project[]> => {
    return projects;
  };

  const fetchAllProjects = async (): Promise<Project[]> => {
    if (profile?.role !== 'manager') return [];
    return projects;
  };

  const fetchProjectById = async (id: string): Promise<Project | null> => {
    const local = projects.find(p => p.id === id);
    if (local) return local;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, profiles!projects_lead_id_fkey(full_name)')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        leadId: data.lead_id,
        leadName: (data.profiles as any)?.full_name || 'Unknown',
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status,
        createdAt: data.created_at,
        memberCount: 0
      };
    } catch (err) {
      console.error('Fetch project by id error:', err);
      return null;
    }
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      loading,
      createProject,
      updateProject,
      deleteProject,
      addMemberToProject,
      removeMemberFromProject,
      fetchProjectMembers,
      fetchProjectLogs,
      tagLogToProject,
      untagLogFromProject,
      fetchMyProjects,
      fetchAllProjects,
      fetchProjectById,
      refreshProjects
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
