import { useContext } from 'react';
import { LogContext } from '@/contexts/LogContext';

export const useLogs = () => {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error('useLogs must be within LogProvider');
  return ctx;
};
