'use client';
import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight, Zap, Hash, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'member' | 'lead' | 'manager'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const virtualEmail = `${employeeId.trim().toLowerCase()}@team-tracker.com`;
      const { data, error } = await supabase.auth.signUp({
        email: virtualEmail,
        password,
        options: { 
          data: { 
            full_name: fullName.trim(),
            role: role,
            employee_id: employeeId.trim()
          },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
        },
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        // Explicitly create profile to bypass potential trigger failures in production
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          role: role,
          employee_id: employeeId.trim(),
          skills: []
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          toast.error('Portal synchronization failed. Database access denied.');
          setIsLoading(false);
          return; // Stop here so user can see the error
        }
        
        toast.success('Identity Created Successfully');
        
        // Intelligent Redirection based on role
        if (role === 'lead') {
          window.location.replace('/lead-login');
        } else if (role === 'manager') {
          window.location.replace('/manager-login');
        } else {
          window.location.replace('/login');
        }
      }
    } catch (error) {
      console.error('Signup system error:', error);
      toast.error('System synchronization error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden font-outfit">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[150px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] p-8 md:p-10 z-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500" />
        
        <div className="text-center space-y-4 mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-2xl group">
              <Zap className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Unit Enrollment</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Corporate Identity Initialization</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Identity</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="text"
                  placeholder="Employee Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-300 transition-all font-bold text-slate-900 text-sm placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            {/* Employee ID */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Corporate ID</label>
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

            {/* Access Tier */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Operations Role</label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-50 border border-slate-100 rounded-2xl">
                {(['member', 'lead', 'manager'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 text-[8px] font-black uppercase tracking-widest transition-all rounded-xl ${
                      role === r 
                      ? 'bg-slate-900 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Security Key</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-300 transition-all font-bold text-slate-900 text-sm placeholder:text-slate-300"
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
              <span>{isLoading ? 'Verifying Identity...' : 'Initialize Access'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
            >
              Already Registered? Sign In
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
