import { useContext } from 'react';
import { ProfileContext } from '@/contexts/ProfileContext';

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be within ProfileProvider');
  return ctx;
};
