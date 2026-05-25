'use client';
import { ReactNode } from 'react';
import { LogProvider } from '@/contexts/LogContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { CopilotProvider } from '@/contexts/CopilotContext';
import AICopilot from '@/components/AICopilot';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <ProjectProvider>
        <LogProvider>
          <CopilotProvider>
            <Toaster position="bottom-right" expand={true} richColors />
            {children}
            <AICopilot />
          </CopilotProvider>
        </LogProvider>
      </ProjectProvider>
    </ProfileProvider>
  );
}
