'use client';
import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import InputBox from './InputBox';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Sparkles, Send } from 'lucide-react';

export default function ChatBot({ onComplete }: { onComplete: (data: any) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! Tell me about your work today. What did you accomplish?', timestamp: Date.now() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    const userMessage: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: text,
          conversationHistory: conversationHistory
        }),
      });

      const data = await response.json();
      const aiReply = data.reply;

      if (aiReply.startsWith('COMPLETE:')) {
        const summary = aiReply.replace('COMPLETE:', '').trim();
        const allUserMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ') + ' ' + text;
        onComplete({ answers: [allUserMessages], summary });
      } else {
        const aiMessage: ChatMessage = { role: 'assistant', content: aiReply, timestamp: Date.now() };
        setMessages(prev => [...prev, aiMessage]);
        setConversationHistory(prev => [...prev, 
          { role: 'user', content: text },
          { role: 'assistant', content: aiReply }
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.', 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-3xl overflow-hidden flex flex-col h-[600px]">
      <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-outfit">WorkLog Assistant</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI System Active</span>
            </div>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-accent animate-pulse" />
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-slate-500" />
                </div>
              )}
              <div className={`max-w-[80%] group relative ${
                m.role === 'user' 
                  ? 'bg-primary text-white rounded-2xl rounded-br-sm shadow-lg shadow-primary/10' 
                  : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm'
              } p-4`}>
                <p className="text-sm leading-relaxed font-medium">{m.content}</p>
                <div className={`absolute top-full mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                  m.role === 'user' ? 'right-0' : 'left-0'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start items-end gap-3"
          >
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-slate-500" />
            </div>
            <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-6 bg-slate-50/50 border-t border-slate-100">
        <InputBox onSend={handleSend} placeholder="Tell me about your day..." disabled={isLoading} />
      </div>
    </div>
  );
}
