'use client';

import { useState } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { useProfile } from '@/hooks/useProfile';
import ProjectCard from '@/components/ProjectCard';
import CreateProjectModal from '@/components/CreateProjectModal';
import { FolderGit2, Plus, Search, ArrowLeft, CheckCircle, Archive, Zap, FileText, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

type FilterTab = 'all' | 'active' | 'completed' | 'archived';

const TAB_CONFIG: { key: FilterTab; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'all', label: 'All Projects', icon: <FolderGit2 className="w-3.5 h-3.5" />, color: 'text-slate-600' },
  { key: 'active', label: 'Active', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-emerald-600' },
  { key: 'completed', label: 'Completed', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-slate-800' },
  { key: 'archived', label: 'Archived', icon: <Archive className="w-3.5 h-3.5" />, color: 'text-slate-400' },
];

export default function ProjectsPage() {
  const { projects, loading, createProject } = useProjects();
  const { profile } = useProfile();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const canCreate = profile?.role === 'lead' || profile?.role === 'manager';

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalLogs: projects.reduce((s, p) => s + (p.logCount ?? 0), 0),
    totalMembers: projects.reduce((s, p) => s + (p.memberCount ?? 0), 0),
  };

  const filtered = projects.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === 'all' || p.status === activeTab;
    return matchSearch && matchTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Projects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Breadcrumb + Title */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Breadcrumb + Title */}
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.push(profile?.role === 'manager' ? '/manager' : '/')}
                className="mt-1 w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20 shrink-0">
                    <FolderGit2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-outfit tracking-tight">Projects Hub</h1>
                    <p className="text-xs text-slate-500 font-medium">Track initiatives, contributions & timelines</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search + Create */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all w-full md:w-52 text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>
              {canCreate && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-slate-900/10 active:scale-[0.98] shrink-0 border border-white/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Project</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Projects', value: stats.total, icon: <FolderGit2 className="w-4 h-4 text-slate-400" />, color: 'text-slate-800' },
              { label: 'Active', value: stats.active, icon: <Zap className="w-4 h-4 text-emerald-500" />, color: 'text-emerald-700' },
              { label: 'Completed', value: stats.completed, icon: <CheckCircle className="w-4 h-4 text-slate-600" />, color: 'text-slate-800' },
              { label: 'Total Logs', value: stats.totalLogs, icon: <FileText className="w-4 h-4 text-blue-500" />, color: 'text-blue-700' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
                {stat.icon}
                <div>
                  <div className={`text-lg font-black ${stat.color} leading-none`}>{stat.value}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar snap-x">
            {TAB_CONFIG.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap snap-start shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-white shadow-sm text-slate-900 border border-slate-200'
                    : `text-slate-400 hover:text-slate-700 ${tab.color}`
                }`}
              >
                {tab.icon}
                {tab.label}
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black ${
                  activeTab === tab.key ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.key === 'all' ? stats.total : projects.filter(p => p.status === tab.key).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-24 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <FolderGit2 className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-700 font-outfit mb-1">No projects found</h3>
              <p className="text-sm text-slate-400 mb-6 text-center max-w-xs">
                {searchQuery
                  ? 'Try a different search or clear the filter.'
                  : activeTab !== 'all'
                  ? `No ${activeTab} projects yet.`
                  : 'Get started by creating your first project.'}
              </p>
              {!searchQuery && activeTab === 'all' && canCreate && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-black transition-colors border border-slate-900 shadow-md shadow-slate-900/10"
                >
                  <Plus className="w-4 h-4" /> Create First Project
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filtered.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async data => {
          await createProject(data);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
