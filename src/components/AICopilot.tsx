'use client';

import React, { useEffect, useRef } from 'react';
import { useCopilot } from '@/contexts/CopilotContext';
import { useProjects } from '@/contexts/ProjectContext';
import { processCopilotCommand } from '@/lib/copilotEngine';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Bot } from 'lucide-react';
import { toast } from 'sonner';

export default function AICopilot() {
  const { isListening, setIsListening, feedbackMessage, showFeedback, setActionPayload } = useCopilot();
  const { projects } = useProjects();
  const router = useRouter();
  
  // Speech Recognition setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          // Get the latest result
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          handleCommand(transcript);
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            toast.error('Voice recognition stopped.');
          }
        };

        recognition.onend = () => {
          // If the browser stops it automatically (e.g. timeout), turn off the orb UI
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect to handle manual toggle
  useEffect(() => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started
      }
    } else if (!isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition not supported in this browser.');
      return;
    }
    setIsListening(!isListening);
  };

  const handleCommand = async (text: string) => {
    if (!text.trim()) return;

    // Show what they said briefly? (Optional)
    const { response, payload } = await processCopilotCommand(text);
    
    if (payload) {
      showFeedback(response);
      setActionPayload(payload);
      if (payload.intent === 'navigate' && payload.targetRoute) {
        router.push(payload.targetRoute);
      } else if (payload.intent === 'log_work') {
        router.push('/log');
      } else if (payload.intent === 'open_project' && payload.projectName) {
        // Find the project by name
        const proj = projects.find(p => p.name.toLowerCase().includes(payload.projectName!.toLowerCase()));
        if (proj) {
          router.push(`/projects/${proj.id}`);
        } else {
          showFeedback(`Could not find project matching "${payload.projectName}".`);
        }
      } else if (payload.intent === 'go_back') {
        router.back();
      }
    }
  };

  return (
    <>
      {/* Top Center Notification */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-slate-900 text-white rounded-full shadow-2xl flex items-center gap-3 border border-slate-700 backdrop-blur-md bg-opacity-90 max-w-[90vw] md:max-w-md"
          >
            <Bot className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm font-semibold tracking-wide truncate">{feedbackMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Glowing Orb */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleListen}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 z-50 group ${
          isListening 
            ? 'bg-emerald-500 text-white shadow-emerald-500/50' 
            : 'bg-slate-900 text-slate-300 shadow-slate-900/20 hover:bg-black hover:text-white'
        }`}
      >
        {/* Pulsing rings when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 w-full h-full rounded-full border-2 border-emerald-400 animate-ping opacity-50" />
            <span className="absolute inset-[-8px] w-[calc(100%+16px)] h-[calc(100%+16px)] rounded-full border border-emerald-400/30 animate-pulse" />
          </>
        )}
        
        <Mic className={`w-6 h-6 z-10 transition-transform duration-300 ${isListening ? 'scale-110' : 'group-hover:scale-110'}`} />
      </motion.button>
    </>
  );
}
