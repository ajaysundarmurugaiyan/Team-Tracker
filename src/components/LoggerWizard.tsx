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
      setTimeout(() => router.replace('/'), 2500);
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
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 -translate-y-1/2 z-0 mx-8" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative z-10 flex flex-col items-center gap-3">
          <div 
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-300 border ${
              step > i ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
              step === i ? 'bg-white border-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-110' :
              'bg-slate-950 border-white/10 text-slate-600'
            }`}
          >
            {step > i ? <Check className="w-5 h-5 stroke-[3px]" /> : i}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-[#020617]/40 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-3xl overflow-hidden relative transition-all duration-500">
      <div className="px-12 py-10 border-b border-white/5 bg-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Rocket className="w-32 h-32 text-white" />
        </div>
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl group">
              <Rocket className="w-7 h-7 text-slate-950 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-[0.2em] uppercase italic">Capture Session</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] opacity-60">Growth Engine v4.0.1</p>
            </div>
          </div>
        </div>
        <StepIndicator />
      </div>

      <div className="p-10 min-h-[480px] flex flex-col">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 flex-1">
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                  <Code className="w-4 h-4 text-blue-500" /> Core Objective
                </h4>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={isLearningOnly ? "DESCRIBE THEORETICAL CONCEPTS..." : "OUTLINE TASKS COMPLETED..."}
                  className="w-full h-56 p-8 bg-white/5 border border-white/5 rounded-3xl focus:outline-none focus:border-blue-500/50 transition-all font-black text-white placeholder:text-slate-700 text-xl tracking-tight shadow-inner"
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-8 flex-1">
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-blue-500" /> Tech Stack
                </h4>
                
                <div className="flex flex-wrap gap-3 mb-12">
                  {SKILL_SUGGESTIONS.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        selectedSkills.some(s => s.toLowerCase() === skill.toLowerCase())
                          ? 'bg-white border-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.1)]'
                          : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                  
                  {/* Render custom skills that aren't in suggestions */}
                  {selectedSkills.filter(s => !SKILL_SUGGESTIONS.some(suggest => suggest.toLowerCase() === s.toLowerCase())).map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className="px-5 py-3 bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 rounded-xl text-xs font-bold transition-all border flex items-center gap-2"
                    >
                      {skill}
                      <Check className="w-3 h-3" />
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Add Not Mentioned Skills</p>
                  <div className="flex gap-3">
                    <div className="relative flex-1 group">
                      <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (customSkill.trim()) {
                              toggleSkill(customSkill.trim());
                              setCustomSkill('');
                            }
                          }
                        }}
                        placeholder="ENTER CUSTOM SKILL (EX: GOOGLE CLOUD)..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-black text-slate-900 text-[10px] tracking-widest placeholder:text-slate-200"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (customSkill.trim()) {
                          toggleSkill(customSkill.trim());
                          setCustomSkill('');
                        }
                      }}
                      className="px-6 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center shadow-lg shadow-slate-900/10"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 flex-1">
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                  <Brain className="w-4 h-4 text-blue-500" /> Strategic Insight
                </h4>
                <textarea
                  value={learnings}
                  onChange={(e) => setLearnings(e.target.value)}
                  placeholder="IDENTIFY A STRATEGIC TAKEAWAY..."
                  className="w-full h-56 p-8 bg-white/5 border border-white/5 rounded-3xl focus:outline-none focus:border-blue-500/50 transition-all font-black text-white placeholder:text-slate-700 text-xl tracking-tight shadow-inner"
                />
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 flex-1 flex flex-col justify-center items-center text-center py-10">
              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mb-6 relative group overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10 animate-pulse" />
                <Sparkles className={`w-10 h-10 text-white relative z-10 ${isSummarizing ? 'animate-spin' : 'animate-bounce'}`} />
              </div>
              <div className="space-y-4">
                <h4 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                  {isSummarizing ? 'Synthesizing...' : 'Audit Ready'}
                </h4>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Protocol Finalization</p>
              </div>
              <div className="bg-white p-12 rounded-[3rem] border border-white shadow-2xl max-w-2xl w-full relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-slate-900 font-black text-2xl tracking-tight leading-snug italic relative z-10">
                  &quot;{aiSummary || 'Syncing data...'}&quot;
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-16 flex justify-between items-center pt-10 border-t border-white/5">
          {step > 1 && step < 4 ? (
            <button onClick={() => setStep(step - 1)} className="px-8 py-3 text-slate-500 font-black hover:text-white transition-colors uppercase tracking-[0.3em] text-[10px]">Back</button>
          ) : <div />}
          
          <button
            onClick={handleNext}
            disabled={(step === 1 && !content.trim()) || isSummarizing || isSyncing || (step === 4 && (!aiSummary || !content.trim()))}
            className="px-10 py-5 bg-white text-slate-950 rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-[0.2em] text-[11px] flex items-center gap-4 disabled:opacity-10 disabled:grayscale"
          >
            {step === 4 ? (
              <>
                <Check className="w-5 h-5 stroke-[3px]" />
                <span>{isSyncing ? 'Synchronizing...' : 'Commit to History'}</span>
              </>
            ) : (
              <>
                <span>{step === 3 ? 'Finalize Audit' : 'Proceed'}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
