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
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 transition-colors duration-300 relative overflow-hidden font-outfit">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] p-10 md:p-12 z-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />
        
        <div className="text-center space-y-4 mb-12">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-[0_20px_40px_rgba(37,99,235,0.2)] group">
              <ShieldCheck className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white italic">LEAD PORTAL</h1>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] opacity-60">Operational Oversight v4.0</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Lead ID</label>
              <div className="relative group">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="EX: 102938"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-white/20 transition-all font-black text-white text-base placeholder:text-slate-800 shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Security Protocol</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-white transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-white/20 transition-all font-black text-white text-base placeholder:text-slate-800 shadow-inner"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-6 bg-white text-slate-950 rounded-[2rem] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 disabled:opacity-10 disabled:grayscale overflow-hidden relative group"
          >
            <span className="relative z-10">{isLoading ? 'Verifying...' : 'Enter Oversight Module'}</span>
            {!isLoading && <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
