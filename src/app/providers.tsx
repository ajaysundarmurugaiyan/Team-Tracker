'use client';
import { ReactNode } from 'react';
import { LogProvider } from '@/contexts/LogContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <ProjectProvider>
        <LogProvider>
          <Toaster position="bottom-right" expand={true} richColors />
          {children}
        </LogProvider>
      </ProjectProvider>
    </ProfileProvider>
  );
}
