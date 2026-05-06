'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Code, Brain, Rocket, Plus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface Props {
  onComplete: (data: any) => void;
}

const QUICK_TAGS = ['Feature Dev', 'Bug Fix', 'Code Review', 'Meeting', 'Planning', 'Testing', 'DevOps'];
const SKILL_SUGGESTIONS = ['React', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind', 'Python', 'SQL', 'Git', 'API'];

export default function LoggerWizard({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [content, setContent] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [learnings, setLearnings] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isLearningOnly, setIsLearningOnly] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleNext = async () => {
    if (step === 3) {
      setStep(4);
      generateSummary();
    } else if (step < 3) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const generateSummary = async () => {
    setIsSummarizing(true);
    try {
      const messages = isLearningOnly 
        ? `Summarize this learning session into a professional conclusion: 
          Topics: ${content}
          Skills explored: ${selectedSkills.join(', ')}
          Key takeaway: ${learnings}`
        : `Summarize this work log into a professional, concise conclusion: 
          Tasks: ${content}
          Skills: ${selectedSkills.join(', ')}
          Learnings: ${learnings}`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages,
          conversationHistory: [{ role: 'system', content: 'You are a professional task auditor. Provide an extremely concise, high-impact summary of EXACTLY what work was done in 8-10 words maximum. No preamble, no full stops.' }]
        }),
      });
      const data = await response.json();
      if (data.reply) {
        setAiSummary(data.reply);
      } else {
        throw new Error('Empty reply');
      }
    } catch (error) {
      console.error('Summary error:', error);
      const fallback = content.length > 50 ? content.substring(0, 50) + '...' : content;
      setAiSummary(fallback);
    } finally {
      setIsSummarizing(false);
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const finish = async () => {
    setIsSyncing(true);
    const finalSummary = aiSummary || content || 'Work session completed';
    try {
      await onComplete({
        answers: [finalSummary],
        skills: selectedSkills,
        learnings: [learnings || (isLearningOnly ? 'Theoretical learning' : 'General progress')]
      });
      triggerConfetti();
      toast.success('Work Log Committed');
      setTimeout(() => router.push('/'), 2500);
    } catch (error) {
      toast.error('Synchronization failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => {
      const exists = prev.some(s => s.toLowerCase() === skill.toLowerCase());
      return exists ? prev.filter(s => s.toLowerCase() !== skill.toLowerCase()) : [...prev, skill];
    });
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-16 relative px-4">
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-200 -translate-y-1/2 z-0 mx-8" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative z-10 flex flex-col items-center gap-3">
          <div 
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all duration-300 border ${
              step > i ? 'bg-slate-900 border-slate-900 text-white' :
              step === i ? 'bg-white border-blue-600 text-blue-600 shadow-lg shadow-blue-100 scale-110' :
              'bg-white border-slate-200 text-slate-300'
            }`}
          >
            {step > i ? <Check className="w-4 h-4" /> : i}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden relative transition-colors">
      <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
              <Rocket className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Capture Session</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Engine v1.0</p>
            </div>
          </div>
        </div>
        <StepIndicator />
      </div>

      <div className="p-10 min-h-[480px] flex flex-col">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-8 flex-1">
              <div>
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-600" /> Core Objective
                </h4>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={isLearningOnly ? "Describe theoretical concepts..." : "Outline tasks completed..."}
                  className="w-full h-44 p-6 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:text-slate-300 text-lg"
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-8 flex-1">
              <div>
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" /> Tech Stack
                </h4>
                <div className="flex flex-wrap gap-2 mb-10">
                  {SKILL_SUGGESTIONS.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-5 py-3 rounded-xl text-xs font-bold transition-all border ${
                        selectedSkills.some(s => s.toLowerCase() === skill.toLowerCase())
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-8 flex-1">
              <div>
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600" /> Strategic Insight
                </h4>
                <textarea
                  value={learnings}
                  onChange={(e) => setLearnings(e.target.value)}
                  placeholder="Identify a strategic takeaway..."
                  className="w-full h-44 p-6 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:text-slate-300 text-lg"
                />
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 flex-1 flex flex-col justify-center items-center text-center py-6">
              <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4 relative">
                <Sparkles className={`w-8 h-8 text-blue-600 ${isSummarizing ? 'animate-spin' : 'animate-bounce'}`} />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isSummarizing ? 'Synthesizing...' : 'Audit Ready'}
              </h4>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 max-w-lg w-full">
                <p className="text-slate-600 font-medium text-lg italic italic">
                  &quot;{aiSummary || 'Syncing data...'}&quot;
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-100">
          {step > 1 && step < 4 ? (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2 text-slate-400 font-black hover:text-slate-900 transition-colors uppercase tracking-[0.2em] text-[10px]">Back</button>
          ) : <div />}
          
          <button
            onClick={handleNext}
            disabled={(step === 1 && !content.trim()) || isSummarizing || isSyncing || (step === 4 && (!aiSummary || !content.trim()))}
            className="px-8 py-3.5 bg-slate-900 text-white rounded-xl shadow-xl shadow-slate-900/10 hover:bg-black transition-all font-black uppercase tracking-widest text-[11px] flex items-center gap-3 disabled:bg-slate-200"
          >
            {step === 4 ? (
              <>
                <Check className="w-4 h-4" />
                <span>{isSyncing ? 'Syncing...' : 'Synchronize & Save'}</span>
              </>
            ) : (
              <>
                <span>{step === 3 ? 'Generate Summary' : 'Proceed'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
