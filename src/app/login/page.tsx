'use client';
import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Zap, Hash } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const virtualEmail = `${employeeId.trim().toLowerCase()}@lumina.sync`;
      const { error } = await (supabase.auth as any).signInWithPassword({ 
        email: virtualEmail, 
        password 
      });

      if (error) {
        toast.error('Invalid Credentials. Verify ID and Password.');
      } else {
        toast.success('Access Granted');
        window.location.replace('/'); // Hard redirect for state initialization and history clearing
      }
    } catch (err) {
      toast.error('Portal synchronization error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 transition-colors duration-300 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[92%] sm:max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-6 sm:p-10 md:p-12 z-10"
      >
        <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20">
              <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900">LUMINA SYNC</h1>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Corporate Access Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee ID</label>
              <div className="relative group">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="text"
                  placeholder="EX: ID-001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:outline-none focus:border-slate-900 transition-all font-bold text-slate-800 text-sm placeholder:text-slate-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Protocol</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:outline-none focus:border-slate-900 transition-all font-bold text-slate-800 text-sm placeholder:text-slate-200"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 sm:pt-6 space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 sm:py-5 bg-slate-900 text-white rounded-xl sm:rounded-[1.25rem] shadow-xl shadow-slate-900/10 hover:bg-black transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 disabled:bg-slate-100 overflow-hidden relative group"
            >
              <span className="relative z-10">{isLoading ? 'Authenticating...' : 'Unlock Portal'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />}
              {isLoading && <div className="absolute inset-0 bg-slate-800 animate-pulse" />}
            </button>
            
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                Request Enrollment
              </button>
              <button
                type="button"
                className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                Recovery
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
