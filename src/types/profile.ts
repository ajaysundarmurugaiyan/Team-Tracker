export interface UserProfile {
  id: string;
  employeeId: string;
  name: string;
  role: 'member' | 'lead';
  skills: Skill[];
  totalLogs: number;
}

export interface Skill {
  name: string;
  count: number;
  lastUsed: string;
}
