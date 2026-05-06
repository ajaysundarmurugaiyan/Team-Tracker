'use client';
import { useState } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function InputBox({ onSend, placeholder, disabled }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full pl-6 pr-14 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 shadow-sm"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="absolute right-2 top-2 bottom-2 px-4 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:bg-slate-200 disabled:shadow-none transition-all flex items-center justify-center group-focus-within:scale-105"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
}
