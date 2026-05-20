'use client';

import { useState } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { useProfile } from '@/hooks/useProfile';
import ProjectCard from '@/components/ProjectCard';
import CreateProjectModal from '@/components/CreateProjectModal';
import { FolderGit2, Plus, Search, ArrowLeft } from 'lucide-react';
import Loader from '@/components/Loader';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const { projects, loading, createProject } = useProjects();
  const { profile } = useProfile();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <Loader />;
  }

  const canCreate = profile?.role === 'lead' || profile?.role === 'manager';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push(profile?.role === 'manager' ? '/manager' : '/')}
            className="mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors shadow-sm"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black font-outfit text-slate-900 dark:text-white flex items-center gap-3">
              <FolderGit2 className="w-8 h-8 text-indigo-500" />
              Projects Hub
            </h1>
            <p className="text-slate-500 mt-1">Manage and track your team's initiatives</p>
          </div>
        </div>

        <div className="flex items-center w-full sm:w-auto gap-4">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm transition-shadow"
            />
          </div>
          
          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          )}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <FolderGit2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 font-outfit mb-2">No projects found</h3>
          <p className="text-slate-500">
            {searchQuery ? "Try adjusting your search query." : "Get started by creating a new project."}
          </p>
          {(!searchQuery && canCreate) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-semibold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => { await createProject(data); }}
      />
    </div>
  );
}
