'use client';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface LoaderProps {
  label?: string;
  sublabel?: string;
}

export default function Loader({ label = "Synchronizing", sublabel = "Team Tracker Core" }: LoaderProps) {
  return (
    <div className="min-h-[400px] w-full flex items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-100">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="relative">
          {/* Pulsing background rings */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 bg-slate-900/5 rounded-full"
          />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className="absolute inset-0 bg-slate-900/10 rounded-full"
          />
          
          {/* Main loader ring */}
          <div className="relative w-24 h-24">
            <svg className="w-full h-full rotate-[-90deg]">
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-100"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="276"
                initial={{ strokeDashoffset: 276 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-slate-900"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Zap className="w-10 h-10 text-slate-900 fill-slate-900" />
              </motion.div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-black text-slate-900 tracking-tight uppercase"
          >
            {label}
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 justify-center"
          >
            <span className="w-12 h-[1px] bg-slate-200" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">
              {sublabel}
            </p>
            <span className="w-12 h-[1px] bg-slate-200" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
