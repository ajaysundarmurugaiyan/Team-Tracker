'use client';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Globe } from 'lucide-react';

interface NetworkErrorProps {
  type?: 'offline' | 'slow';
  onRetry?: () => void;
}

export default function NetworkError({ type = 'offline', onRetry }: NetworkErrorProps) {
  const isSlow = type === 'slow';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border border-slate-200 rounded-[2.5rem] p-10 text-center shadow-2xl shadow-slate-200/50"
      >
        <div className="relative w-24 h-24 mx-auto mb-10">
          <div className="absolute inset-0 bg-red-50 rounded-[2rem] rotate-6" />
          <div className="absolute inset-0 bg-white border-2 border-red-100 rounded-[2rem] flex items-center justify-center shadow-sm">
            {isSlow ? (
              <Globe className="w-12 h-12 text-red-500 animate-pulse" />
            ) : (
              <WifiOff className="w-12 h-12 text-red-500" />
            )}
          </div>
        </div>

        <div className="space-y-4 mb-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {isSlow ? 'Network Congestion' : 'Signal Lost'}
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            {isSlow 
              ? 'Your connection is unstable, preventing high-precision data synchronization.' 
              : 'Unable to establish a secure link with the Team Tracker servers. Please check your connection.'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onRetry?.() || window.location.reload()}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-900/20 group"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
            <span>Restore Connection</span>
          </button>
          
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Error Code: {isSlow ? 'SYS_LATENCY_HIGH' : 'SYS_NET_OFFLINE'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
