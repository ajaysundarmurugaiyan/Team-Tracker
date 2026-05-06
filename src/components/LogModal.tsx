'use client';
import { WorkLog } from '@/types/log';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Code, Brain } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: WorkLog[];
  date: string;
}

export default function LogModal({ isOpen, onClose, logs, date }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{date}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Daily Audit Stream</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 group"
                >
                  <X className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(80vh-140px)] space-y-10 scrollbar-hide">
                {logs.map((log, i) => (
                  <div key={i} className="relative pl-10 border-l-2 border-slate-100 group">
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-900 transition-all group-hover:scale-125" />
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded text-white">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                          <Code className="w-3 h-3" />
                          Activity Content
                        </div>
                        <p className="text-lg font-medium text-slate-700 leading-relaxed italic">
                          &quot;{log.content}&quot;
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {log.skills.map((skill) => (
                          <span 
                            key={skill} 
                            className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded border border-blue-100"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {log.learnings.length > 0 && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                          <div className="flex items-center gap-2 mb-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                            <Brain className="w-3.5 h-3.5" />
                            Core Learning
                          </div>
                          <p className="text-sm font-bold text-slate-600 leading-relaxed">
                            {log.learnings.join('. ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
