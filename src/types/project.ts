export interface Project {
  id: string;
  name: string;
  description: string | null;
  leadId: string;
  leadName?: string;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  memberCount?: number;
  logCount?: number;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  memberId: string;
  memberName?: string;
  employeeId?: string;
  role: string;
  joinedAt: string;
  leftAt: string | null;
}

export interface ProjectLog {
  id: string;
  projectId: string;
  logId: string;
}
