'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Sparkles, Code, Brain, Rocket, Plus, ArrowRight, 
  Bot, User, Send, ArrowLeft, RefreshCw, Trash2, Clock, 
  MessageSquare, Edit2, AlertCircle, X, ChevronRight, CheckCircle2, FolderGit2
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { ChatMessage } from '@/types/chat';
import { extractSkills, extractLearnings } from '@/lib/parser';
import { useProjects } from '@/contexts/ProjectContext';

interface Props {
  onComplete: (data: { answers: string[]; skills: string[]; learnings: string[]; projectId?: string }) => Promise<void>;
}

const STARTER_CHIPS = [
  'I worked on frontend UI and component styling.',
  'I resolved database sync latency issues.',
  'I created unit tests and refactored core service hooks.',
  'I set up a new CI/CD deployment pipeline.'
];

const POPULAR_SKILLS = [
  'React', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind', 'Python', 'SQL', 'Git', 'Docker'
];

export default function LoggerWizard({ onComplete }: Props) {
  const [step, setStep] = useState(1); // 1: Welcome, 2: Chat, 3: Review, 4: Success
  const [activeTab, setActiveTab] = useState<'chat' | 'intel'>('chat'); // Responsive mobile tab view
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  
  // Curated lists on Review/Capture stage
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [learningsList, setLearningsList] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { projects } = useProjects();
  
  // Custom field controls
  const [customSkill, setCustomSkill] = useState('');
  const [customLearning, setCustomLearning] = useState('');
  
  // Loading states
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (step === 2) {
      scrollToBottom();
    }
  }, [messages, step, isLoading]);

  // Initial welcome message from AI once chat starts
  const startConversation = () => {
    setStep(2);
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm your performance auditing assistant. Let's capture your achievements today. What primary tasks did you work on?",
          timestamp: Date.now()
        }
      ]);
    }
  };

  // Directly skip to manual log entry if user prefers
  const startManualLog = () => {
    setSelectedSkills(['General']);
    setLearningsList(['General progress logged manually.']);
    setAiSummary('Manual work session logged.');
    setStep(3);
  };

  // Chat message submission
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Live extract skills & learnings from this response
    const extractedSkills = extractSkills(text);
    setSelectedSkills(prev => {
      const merged = [...prev];
      extractedSkills.forEach(s => {
        if (s && s.toLowerCase() !== 'general' && !merged.some(m => m.toLowerCase() === s.toLowerCase())) {
          merged.push(s);
        }
      });
      return merged;
    });

    const extractedLearnings = extractLearnings(text);
    setLearningsList(prev => {
      const merged = [...prev];
      extractedLearnings.forEach(l => {
        if (l && l.toLowerCase() !== 'no specific learnings captured today.' && !merged.some(m => m.toLowerCase() === l.toLowerCase())) {
          merged.push(l);
        }
      });
      return merged;
    });

    try {
      const chatHistoryForAPI = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: text,
          conversationHistory: chatHistoryForAPI
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiReply = data.reply || '';

      // Check if conversation is complete
      if (aiReply.toUpperCase().includes('COMPLETE:')) {
        const parts = aiReply.split(/COMPLETE:/i);
        const summaryText = parts[1]?.trim() || aiReply.replace(/COMPLETE:/i, '').trim();
        setAiSummary(summaryText);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiReply,
          timestamp: Date.now()
        }]);
        
        // Let user see the complete message briefly, then transition
        setTimeout(() => {
          setStep(3);
        }, 1500);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiReply,
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('AI session offline. You can finalize manually.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble syncing with the neural link. Feel free to click 'Finalize Audit' to submit what we have so far.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Compile final summary using API if force finalized
  const handleForceFinalize = async () => {
    setIsSummarizing(true);
    setStep(3); // Transition to review screen immediately to show loader

    const userMessagesText = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n');

    if (!userMessagesText.trim()) {
      setAiSummary('Manual session logged.');
      setIsSummarizing(false);
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: `Summarize this log conversation into a professional, concise one-sentence description of work done (max 15 words): ${userMessagesText}`,
          conversationHistory: []
        })
      });

      const data = await response.json();
      const summary = data.reply ? data.reply.replace(/COMPLETE:/i, '').trim() : userMessagesText.substring(0, 100);
      setAiSummary(summary);
    } catch (err) {
      console.error(err);
      setAiSummary(userMessagesText.substring(0, 60) + '...');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Save everything to Supabase
  const handleCommitLog = async () => {
    setIsSyncing(true);
    const finalSummary = aiSummary.trim() || 'Work session logged.';
    const finalSkills = selectedSkills.length > 0 ? selectedSkills : ['General'];
    const finalLearnings = learningsList.length > 0 ? learningsList : ['Progress logged successfully.'];

    try {
      await onComplete({
        answers: [finalSummary],
        skills: finalSkills,
        learnings: finalLearnings,
        projectId: selectedProjectId || undefined
      });

      // Show success screen
      setStep(4);
      triggerConfetti();
      toast.success('Log successfully synchronized.');
      setTimeout(() => {
        router.replace('/');
      }, 2500);
    } catch (err) {
      toast.error('Sync failed. Please retry.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Confetti celebration animation
  const triggerConfetti = () => {
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 60 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 200);
  };

  // Tag helper management
  const addSkillTag = (skillName: string) => {
    const clean = skillName.trim();
    if (!clean) return;
    if (!selectedSkills.some(s => s.toLowerCase() === clean.toLowerCase())) {
      setSelectedSkills(prev => [...prev, clean]);
    }
    setCustomSkill('');
  };

  const removeSkillTag = (skillName: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skillName));
  };

  const addLearningItem = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    if (!learningsList.some(l => l.toLowerCase() === clean.toLowerCase())) {
      setLearningsList(prev => [...prev, clean]);
    }
    setCustomLearning('');
  };

  const removeLearningItem = (index: number) => {
    setLearningsList(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate approximate chat completion progress (capped at 3 turns)
  const chatTurnCount = messages.filter(m => m.role === 'user').length;
  const progressPercent = Math.min((chatTurnCount / 3) * 100, 100);

  return (
    <div className="w-full max-w-5xl mx-auto font-outfit">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: WELCOME SCREEN */}
        {step === 1 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-6 sm:p-10 md:p-12 relative overflow-hidden"
          >
            {/* Background glowing decorations */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-2xl mx-auto text-center space-y-6 md:space-y-8 relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-950 rounded-2xl shadow-xl shadow-slate-900/10 mb-2">
                <Bot className="w-8 h-8 text-white animate-pulse" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                  Initialize <span className="text-blue-600">Audit Session</span>
                </h2>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  Dynamic AI-Assisted Performance Capture
                </p>
              </div>

              <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
                Connect with our work log AI to naturally discuss your daily achievements. 
                We will automatically extract used skills, track learnings, and format a professional audit log.
              </p>

              {/* Project Pre-Selector */}
              {projects.length > 0 && (
                <div className="max-w-md mx-auto w-full pt-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tag to Project (Optional)</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                      {/* None option */}
                      <button
                        type="button"
                        onClick={() => setSelectedProjectId('')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                          selectedProjectId === ''
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                        }`}
                      >
                        General Log (No Project)
                      </button>
                      {projects.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProjectId(p.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold transition-all border flex items-center justify-between ${
                            selectedProjectId === p.id
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
                          }`}
                        >
                          <span>{p.name}</span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                            selectedProjectId === p.id
                              ? 'bg-white/20 text-white'
                              : p.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-slate-50 text-slate-400 border border-slate-200'
                          }`}>{p.status}</span>
                        </button>
                      ))}
                    </div>
                    {selectedProjectId && (
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>This log will be auto-linked to <strong>{projects.find(p => p.id === selectedProjectId)?.name}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <button
                  onClick={startConversation}
                  className="w-full sm:w-auto flex-1 px-6 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
                >
                  <span>Start AI Conversation</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
                <button
                  onClick={startManualLog}
                  className="w-full sm:w-auto flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-450" />
                  <span>Manual Entry</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: ACTIVE CONVERSATIONAL CHAT */}
        {step === 2 && (
          <motion.div
            key="chat-session"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col gap-4 w-full"
          >
            {/* Mobile Tab Switcher */}
            <div className="flex lg:hidden border border-slate-200 bg-slate-50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  activeTab === 'chat'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Chat Assistant
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('intel')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'intel'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>Session Intel</span>
                {(selectedSkills.length > 0 || learningsList.length > 0) && (
                  <span className="w-4 h-4 bg-blue-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {selectedSkills.length + learningsList.length}
                  </span>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left: Chat Container */}
              <div className={`lg:col-span-8 flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-md overflow-hidden h-[460px] sm:h-[500px] lg:h-[580px] ${
                activeTab === 'chat' ? 'flex' : 'hidden lg:flex'
              }`}>
                
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Audit Session AI</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Listening</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleForceFinalize}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Finalize Audit</span>
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin bg-slate-50/10">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2.5`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-lg bg-slate-150 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}
                        
                        <div className={`p-3 md:p-4 rounded-xl max-w-[85%] sm:max-w-[75%] shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-slate-900 text-white rounded-tr-none font-medium text-xs md:text-sm leading-relaxed'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none font-medium text-xs md:text-sm leading-relaxed'
                        }`}>
                          {msg.content.includes('COMPLETE:') ? (
                            <div className="space-y-1.5">
                              <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black tracking-widest uppercase rounded">Audit Complete</span>
                              <p className="italic text-slate-600 font-bold">&quot;{msg.content.replace(/COMPLETE:/i, '').trim()}&quot;</p>
                            </div>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                          <span className={`block text-[7px] mt-1.5 font-bold uppercase ${msg.role === 'user' ? 'text-slate-400 text-right' : 'text-slate-350'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {msg.role === 'user' && (
                          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 text-white">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl rounded-tl-none shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input / Starters footer */}
                <div className="p-4 border-t border-slate-100 bg-white space-y-3">
                  {/* Suggestions displayed if no user messages yet */}
                  {chatTurnCount === 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-wider">Select a starter response:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {STARTER_CHIPS.map((chip, index) => (
                          <button
                            key={index}
                            onClick={() => handleSendMessage(chip)}
                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-slate-600 hover:text-slate-900 text-[10px] font-medium transition-all"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage(input);
                    }}
                    className="flex gap-2 relative group"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Describe your work, achievements, or challenges..."
                      disabled={isLoading}
                      className="flex-1 pl-4 pr-12 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium text-xs text-slate-800 placeholder:text-slate-400 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-slate-900 hover:bg-black text-white rounded-lg shadow-sm transition-all flex items-center justify-center disabled:opacity-20"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

              </div>

              {/* Right: Live Session Intelligence Panel */}
              <div className={`lg:col-span-4 flex flex-col space-y-4 ${
                activeTab === 'intel' ? 'flex' : 'hidden lg:flex'
              }`}>
                
                {/* Progress Tracker Card */}
                <div className="bg-white rounded-[1.5rem] border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" /> Audit Depth
                    </h4>
                    <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">{chatTurnCount}/3 turns</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-950 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                    We require around 2-3 conversation exchanges to automatically summarize your work log effectively.
                  </p>
                </div>

                {/* Live Skills Card */}
                <div className="bg-white rounded-[1.5rem] border border-slate-200 p-4 shadow-sm flex-1 flex flex-col justify-between min-h-[160px]">
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-500" /> Extracted Skills
                    </h4>
                    
                    {selectedSkills.length === 0 ? (
                      <div className="py-4 text-center">
                        <span className="text-[10px] text-slate-350 font-medium">No skills detected. Mention tech stack in chat.</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSkills.map((skill, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 bg-blue-50 border border-blue-100 rounded-lg text-blue-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => removeSkillTag(skill)}
                              className="hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Predefined skill injections */}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-wider mb-1.5">Quick Inject:</p>
                      <div className="flex flex-wrap gap-1">
                        {POPULAR_SKILLS.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => addSkillTag(skill)}
                            disabled={selectedSkills.some(s => s.toLowerCase() === skill.toLowerCase())}
                            className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 hover:border-slate-300 rounded text-[8px] font-bold text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-all uppercase tracking-widest"
                          >
                            +{skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Manual Skill Inject Input */}
                  <div className="pt-3 border-t border-slate-100 mt-3 flex gap-1.5">
                    <input
                      type="text"
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      placeholder="Add skill manually..."
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-semibold text-[9px] text-slate-800 placeholder:text-slate-350 uppercase tracking-wider"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkillTag(customSkill);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addSkillTag(customSkill)}
                      className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-black transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Live Learnings Card */}
                <div className="bg-white rounded-[1.5rem] border border-slate-200 p-4 shadow-sm flex-1 flex flex-col justify-between min-h-[160px]">
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-emerald-500" /> Strategic Learnings
                    </h4>

                    {learningsList.length === 0 ? (
                      <div className="py-4 text-center">
                        <span className="text-[10px] text-slate-350 font-medium">No learnings captured. Mention insights in chat.</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin pr-1">
                        {learningsList.map((item, index) => (
                          <div
                            key={index}
                            className="p-2 bg-emerald-50/50 border border-emerald-100/50 rounded-lg flex items-start gap-1.5 text-slate-700 text-[10px] font-medium"
                          >
                            <span className="text-emerald-500 font-black mt-0.5">•</span>
                            <span className="flex-1 leading-relaxed italic">&quot;{item}&quot;</span>
                            <button
                              type="button"
                              onClick={() => removeLearningItem(index)}
                              className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual Learning Inject Input */}
                  <div className="pt-3 border-t border-slate-100 mt-3 flex gap-1.5">
                    <input
                      type="text"
                      value={customLearning}
                      onChange={(e) => setCustomLearning(e.target.value)}
                      placeholder="Add learning details..."
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium text-[10px] text-slate-800 placeholder:text-slate-350"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLearningItem(customLearning);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addLearningItem(customLearning)}
                      className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-black transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: AUDIT REVIEW & CONFIRMATION */}
        {step === 3 && (
          <motion.div
            key="audit-review"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-5 sm:p-8 md:p-10 space-y-8 relative overflow-hidden"
          >
            {/* Header */}
            <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Review Performance Audit</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Verify summary & tags before commit</p>
                </div>
              </div>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-[8px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Resume Conversation</span>
                </button>
              )}
            </div>

            {isSummarizing ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-10 h-10 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin shadow-sm" />
                <div className="space-y-1">
                  <span className="block text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Synthesizing Audit Summary</span>
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Structuring corporate intelligence record</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Editable Summary */}
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    AI-Synthesized Summary
                  </label>
                  <textarea
                    value={aiSummary}
                    onChange={(e) => setAiSummary(e.target.value)}
                    placeholder="Enter manual work log summary..."
                    className="w-full h-[180px] md:h-[220px] p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-300 focus:bg-white transition-all font-medium text-slate-900 placeholder:text-slate-350 text-xs md:text-sm leading-relaxed tracking-tight shadow-sm"
                  />
                  
                  {/* Optional Project Tagging */}
                  {projects.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
                        <Rocket className="w-3.5 h-3.5 text-orange-500" />
                        Tag to Project (Optional)
                      </label>
                      <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-slate-300 font-medium text-slate-700 text-xs shadow-sm cursor-pointer"
                      >
                        <option value="">-- Unassigned (General Log) --</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-medium ml-1 mt-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span>This summary will be saved to your dashboard and visible to squad leads.</span>
                  </div>
                </div>

                {/* Right Column: Skills & Learnings */}
                <div className="space-y-6">
                  
                  {/* Skills Grid */}
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-500" />
                      Applied Technology Stack
                    </label>
                    
                    <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl min-h-[70px]">
                      {selectedSkills.length === 0 ? (
                        <span className="text-slate-350 text-[10px] font-semibold self-center mx-auto">No skills added yet</span>
                      ) : (
                        selectedSkills.map((skill, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 bg-white border border-slate-200/80 rounded-lg text-slate-800 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => removeSkillTag(skill)}
                              className="hover:text-red-500 text-slate-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        placeholder="Type and press enter to add skill..."
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200/85 rounded-xl focus:outline-none focus:border-slate-400 font-semibold text-[9px] text-slate-800 placeholder:text-slate-350 uppercase tracking-widest"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkillTag(customSkill);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addSkillTag(customSkill)}
                        className="px-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-colors font-black text-[8px] uppercase tracking-wider"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Learnings Grid */}
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-emerald-500" />
                      Key Learnings & takeaways
                    </label>

                    <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl min-h-[80px] max-h-32 overflow-y-auto scrollbar-thin">
                      {learningsList.length === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[50px]">
                          <span className="text-slate-350 text-[10px] font-semibold">No learning bullets added</span>
                        </div>
                      ) : (
                        learningsList.map((item, index) => (
                          <div
                            key={index}
                            className="p-2 bg-white border border-slate-200/80 rounded-lg flex items-start justify-between gap-2.5 text-slate-755 text-[10px] font-medium shadow-sm"
                          >
                            <div className="flex gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span className="leading-relaxed italic">&quot;{item}&quot;</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLearningItem(index)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 animate-none" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customLearning}
                        onChange={(e) => setCustomLearning(e.target.value)}
                        placeholder="Add strategic insight or takeaway..."
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200/85 rounded-xl focus:outline-none focus:border-slate-400 font-medium text-[10px] text-slate-800 placeholder:text-slate-350"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addLearningItem(customLearning);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addLearningItem(customLearning)}
                        className="px-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-colors font-black text-[8px] uppercase tracking-wider"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Commit / Save Actions footer */}
            {!isSummarizing && (
              <div className="pt-6 border-t border-slate-100 flex justify-end items-center gap-4">
                <button
                  type="button"
                  onClick={handleCommitLog}
                  disabled={isSyncing || (!aiSummary.trim() && selectedSkills.length === 0 && learningsList.length === 0)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 text-white rounded-xl shadow-md hover:bg-black active:scale-[0.98] transition-all font-black uppercase tracking-[0.15em] text-[9px] flex items-center justify-center gap-2.5 disabled:opacity-20"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3px]" />
                  <span>{isSyncing ? 'Synchronizing...' : 'Commit to History'}</span>
                </button>
              </div>
            )}

          </motion.div>
        )}

        {/* STEP 4: CELEBRATION SUCCESS SCREEN */}
        {step === 4 && (
          <motion.div
            key="success-celebration"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-8 md:p-14 text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="max-w-md mx-auto space-y-4 relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mb-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Audit Completed</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Performance Synced Successfully</p>
              </div>

              <p className="text-slate-555 text-xs leading-relaxed">
                Your performance capture session has been committed to the secure ledger. Redirecting to tactical dashboard...
              </p>

              <div className="pt-4">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
