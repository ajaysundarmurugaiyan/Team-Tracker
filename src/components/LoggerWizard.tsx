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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
      generateSuggestions();
    } else if (step === 3) {
      setStep(4);
      generateSummary();
    } else {
      finish();
    }
  };

  const generateSuggestions = async () => {
    if (suggestions.length > 0 || !content.trim()) return;
    setIsGeneratingSuggestions(true);
    try {
      const messages = `Based on these tasks: "${content}", suggest 3 high-impact, professional "strategic takeaways" or "learnings". 
      Format: Provide exactly 3 bullet points, each 5-8 words. No other text.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages,
          conversationHistory: [{ role: 'system', content: 'You are an AI career coach. Provide extremely concise, professional strategic insights. No preamble.' }]
        }),
      });
      const data = await response.json();
      if (data.reply) {
        const lines = data.reply.split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[•\-\d\.]\s*/, '').trim()).slice(0, 3);
        setSuggestions(lines);
      }
    } catch (error) {
      console.error('Suggestions error:', error);
    } finally {
      setIsGeneratingSuggestions(false);
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
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-100 -translate-y-1/2 z-0 mx-8" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative z-10 flex flex-col items-center gap-3">
          <div 
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-300 border ${
              step > i ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
              step === i ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-110' :
              'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            {step > i ? <Check className="w-5 h-5 stroke-[3px]" /> : i}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden relative transition-all duration-500">
      <div className="px-12 py-10 border-b border-slate-100 bg-slate-50/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Rocket className="w-32 h-32 text-slate-900" />
        </div>
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg group">
              <Rocket className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Capture Session</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Performance Analytics</p>
            </div>
          </div>
        </div>
        <StepIndicator />
      </div>

      <div className="p-6 md:p-10 min-h-[400px] md:min-h-[480px] flex flex-col">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 flex-1">
              <div>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                  <Code className="w-4 h-4 text-blue-500" /> Core Objective
                </h4>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={isLearningOnly ? "Describe technical concepts..." : "Outline tasks completed..."}
                  className="w-full h-48 p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-300 focus:bg-white transition-all font-medium text-slate-900 placeholder:text-slate-300 text-sm tracking-tight shadow-sm"
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
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xl'
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
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
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                    <Brain className="w-4 h-4 text-blue-500" /> Suggested Insights
                  </h4>
                  {isGeneratingSuggestions && <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setLearnings(s)}
                      className={`p-5 rounded-2xl text-left transition-all border ${
                        learnings === s 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${learnings === s ? 'bg-white/20' : 'bg-white border border-slate-100'}`}>
                          {i + 1}
                        </div>
                        <p className="text-[11px] font-bold italic tracking-tight leading-snug">&quot;{s}&quot;</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Custom Insight Override</p>
                  <textarea
                    value={learnings}
                    onChange={(e) => setLearnings(e.target.value)}
                    placeholder="Identify a custom strategic takeaway..."
                    className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-300 focus:bg-white transition-all font-medium text-slate-900 placeholder:text-slate-300 text-sm tracking-tight shadow-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 flex-1 flex flex-col justify-center items-center text-center py-10">
              <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-[2rem] flex items-center justify-center mb-6 relative group overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                <Sparkles className={`w-10 h-10 text-slate-900 relative z-10 ${isSummarizing ? 'animate-spin' : 'animate-bounce'}`} />
              </div>
              <div className="space-y-4">
                <h4 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                  {isSummarizing ? 'Synthesizing...' : 'Audit Ready'}
                </h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Protocol Finalization</p>
              </div>
              <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl max-w-2xl w-full relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-slate-900 font-black text-2xl tracking-tight leading-snug italic relative z-10">
                  &quot;{aiSummary || 'Syncing data...'}&quot;
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-100">
          {step > 1 && step < 4 ? (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2 text-slate-400 font-black hover:text-slate-900 transition-colors uppercase tracking-[0.2em] text-[9px]">Back</button>
          ) : <div />}
          
          <button
            onClick={handleNext}
            disabled={(step === 1 && !content.trim()) || isSummarizing || isSyncing || (step === 4 && (!aiSummary || !content.trim()))}
            className="px-8 py-4 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-black active:scale-[0.98] transition-all font-black uppercase tracking-[0.15em] text-[10px] flex items-center gap-4 disabled:opacity-10"
          >
            {step === 4 ? (
              <>
                <Check className="w-4 h-4 stroke-[3px]" />
                <span>{isSyncing ? 'Synchronizing...' : 'Commit to History'}</span>
              </>
            ) : (
              <>
                <span>{step === 3 ? 'Finalize Audit' : 'Proceed'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
