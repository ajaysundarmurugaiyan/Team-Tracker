'use client';
import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Briefcase, ArrowRight, Hash, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerLoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const virtualEmail = `${employeeId.trim().toLowerCase()}@team-tracker.com`;
      const { data, error } = await (supabase.auth as any).signInWithPassword({ 
        email: virtualEmail, 
        password 
      });

      if (error) {
        toast.error('Invalid Credentials.');
      } else if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'lead') {
          toast.info('Lead identity detected. Redirecting to Lead Portal...');
          window.location.replace('/lead-login');
        } else if (profile?.role === 'member') {
          toast.info('Member identity detected. Redirecting to Member Portal...');
          window.location.replace('/login');
        } else {
          toast.success('Executive Access Granted');
          window.location.replace('/manager');
        }
      }
    } catch (err) {
      toast.error('System error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Executive Backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-900/30 blur-[150px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800/50 rounded-[3rem] p-10 sm:p-12 shadow-2xl space-y-10">
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                <Briefcase className="w-7 h-7 text-slate-900" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Executive</h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Managerial Oversight</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="ID NUMBER"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-blue-500/50 transition-all font-bold text-white text-xs tracking-widest placeholder:text-slate-700"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="password"
                  placeholder="SECURITY KEY"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-blue-500/50 transition-all font-bold text-white text-xs tracking-widest placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-white text-slate-900 rounded-2xl shadow-xl hover:bg-blue-50 transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
            >
              {isLoading ? 'Verifying...' : 'Authenticate'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.5em]">System Protected by Audit Protocol v3.0</p>
        </div>
      </motion.div>
    </div>
  );
}
