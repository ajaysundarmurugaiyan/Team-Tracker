'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type CopilotActionPayload = {
  intent: 'log_work' | 'navigate' | 'open_project' | 'switch_tab' | 'go_back' | 'unknown';
  projectName?: string;
  taskDetails?: string;
  hours?: string;
  targetRoute?: string;
  tabName?: string;
};

interface CopilotContextProps {
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
  feedbackMessage: string | null;
  setFeedbackMessage: (msg: string | null) => void;
  showFeedback: (msg: string) => void;
  actionPayload: CopilotActionPayload | null;
  setActionPayload: (payload: CopilotActionPayload | null) => void;
}

const CopilotContext = createContext<CopilotContextProps | undefined>(undefined);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [actionPayload, setActionPayload] = useState<CopilotActionPayload | null>(null);

  const showFeedback = useCallback((msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000); // clear after 4 seconds
  }, []);

  return (
    <CopilotContext.Provider value={{
      isListening, setIsListening,
      feedbackMessage, setFeedbackMessage, showFeedback,
      actionPayload, setActionPayload
    }}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const context = useContext(CopilotContext);
  if (!context) throw new Error('useCopilot must be used within a CopilotProvider');
  return context;
}
