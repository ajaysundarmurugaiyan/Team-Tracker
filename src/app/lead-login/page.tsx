'use client';
import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Zap, Hash, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function LeadLoginPage() {
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
        toast.error('Invalid Lead Credentials.');
      } else if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'manager') {
          toast.info('Executive identity detected. Redirecting to Manager Portal...');
          window.location.replace('/manager-login');
        } else if (profile?.role === 'member') {
          toast.info('Member identity detected. Redirecting to Member Portal...');
          window.location.replace('/login');
        } else {
          toast.success('Lead Access Granted');
          window.location.replace('/lead');
        }
      }
    } catch (err) {
      toast.error('Portal synchronization error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden font-outfit">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[150px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] p-8 md:p-10 z-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />
        
        <div className="text-center space-y-4 mb-10">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl group">
              <ShieldCheck className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Lead Portal</h1>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1.5">Operational Oversight</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lead ID</label>
              <div className="relative group">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="ID Number"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-300 transition-all font-bold text-slate-900 text-sm placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Security Protocol</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-slate-300 transition-all font-bold text-slate-900 text-xs placeholder:text-slate-300"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-5">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-black active:scale-[0.98] transition-all font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <span>{isLoading ? 'Synchronizing...' : 'Establish Command'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
