'use client';
import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight, Zap, Hash, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'member' | 'lead'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const virtualEmail = `${employeeId.trim().toLowerCase()}@lumina.sync`;
      const { error } = await (supabase.auth as any).signUp({
        email: virtualEmail,
        password,
        options: { 
          data: { 
            full_name: fullName, 
            role: role,
            employee_id: employeeId.trim()
          } 
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Identity Created Successfully');
        window.location.href = '/login'; 
      }
    } catch (err) {
      toast.error('System synchronization error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100 blur-[120px] rounded-full" />
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
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Corporate Audit Enrollment</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4 sm:space-y-6">
          <div className="space-y-4 sm:space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="text"
                  placeholder="Employee Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:outline-none focus:border-slate-900 transition-all font-bold text-slate-800 text-sm placeholder:text-slate-200"
                  required
                />
              </div>
            </div>

            {/* Employee ID */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate ID</label>
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

            {/* Access Tier */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Operations Role</label>
              <div className="flex gap-2 p-1 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl">
                <button
                  type="button"
                  onClick={() => setRole('member')}
                  className={`flex-1 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all rounded-lg sm:rounded-xl ${role === 'member' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Member
                </button>
                <button
                  type="button"
                  onClick={() => setRole('lead')}
                  className={`flex-1 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all rounded-lg sm:rounded-xl ${role === 'lead' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Lead
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
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
              <span className="relative z-10">{isLoading ? 'Verifying Identity...' : 'Initialize Access'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />}
              {isLoading && <div className="absolute inset-0 bg-slate-800 animate-pulse" />}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
            >
              <span>Already Registered? Access Portal</span>
              <Sparkles className="w-3 h-3" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
