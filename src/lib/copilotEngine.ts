import { CopilotActionPayload } from '@/contexts/CopilotContext';

// Simulated AI Engine to parse intents without needing an API Key.
// In a production environment, this would call /api/chat (OpenAI/Anthropic).
export async function processCopilotCommand(text: string): Promise<{ response: string; payload: CopilotActionPayload | null }> {
  const lowerText = text.toLowerCase();

  // 1. Check for Go Back Intents
  if (lowerText.includes('go back') || lowerText.includes('previous page')) {
    return {
      response: 'Going back to the previous page.',
      payload: { intent: 'go_back' }
    };
  }

  // 2. Tab Switching Intents
  const tabMatch = lowerText.match(/(?:switch to|open|go to) (activity|members|skills|retrospective|team|lead|timeline|intel|general|activity feed|team feed|skill matrix|team and lead|team and leads) (?:tab|view|feed)?/i) || 
                   lowerText.match(/(activity|members|skills|retrospective|team|lead|timeline|intel|general|activity feed|team feed|skill matrix|team and lead|team and leads) (?:tab|view|feed)/i);
                   
  if (tabMatch && tabMatch[1]) {
    let tab = tabMatch[1].toLowerCase().trim();
    if (tab === 'activity feed') tab = 'activity';
    if (tab === 'team feed' || tab === 'team' || tab === 'lead' || tab.includes('team and lead')) tab = 'members';
    if (tab === 'timeline') tab = 'retrospective';
    if (tab === 'skill matrix') tab = 'skills';
    
    return {
      response: `Switching to the ${tab} view.`,
      payload: { intent: 'switch_tab', tabName: tab }
    };
  }

  // 3. Check for Navigation Intents
  if (lowerText.includes('manager')) {
    return {
      response: 'Taking you to the Manager Portal.',
      payload: { intent: 'navigate', targetRoute: '/manager' }
    };
  }

  if (lowerText.includes('lead')) {
    return {
      response: 'Taking you to the Lead Portal.',
      payload: { intent: 'navigate', targetRoute: '/lead' }
    };
  }

  if (lowerText.includes('dashboard') || lowerText.includes('home')) {
    return {
      response: 'Navigating to your dashboard now.',
      payload: { intent: 'navigate', targetRoute: '/' }
    };
  }
  
  if (lowerText.includes('calendar')) {
    return {
      response: 'Taking you to the Activity Calendar.',
      payload: { intent: 'navigate', targetRoute: '/calendar' }
    };
  }
  
  if (lowerText.includes('initialize capture') || lowerText.includes('open initialize capture')) {
    return {
      response: 'Opening the Logger Wizard.',
      payload: { intent: 'navigate', targetRoute: '/log' }
    };
  }
  
  if (lowerText.includes('open project')) {
    const match = lowerText.match(/open project\s+([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      return {
        response: `Opening project ${match[1]}...`,
        payload: { intent: 'open_project', projectName: match[1] }
      };
    }
  }

  if (lowerText.includes('projects') && !lowerText.includes('log')) {
    return {
      response: 'Taking you to the Projects Hub.',
      payload: { intent: 'navigate', targetRoute: '/projects' }
    };
  }

  // 2. Check for Logging Work Intents
  if (lowerText.includes('log') || lowerText.includes('task') || lowerText.includes('worked on')) {
    // Attempt simple extraction
    let projectName = '';
    const projectMatch = lowerText.match(/project\s+([a-zA-Z0-9_-]+)/i);
    if (projectMatch && projectMatch[1]) {
      projectName = projectMatch[1];
    } else {
      // Look for "for [name]"
      const forMatch = lowerText.match(/for\s+([a-zA-Z0-9_-]+)/i);
      if (forMatch && forMatch[1]) projectName = forMatch[1];
    }

    // Clean up task details by removing the intent trigger words naively
    let taskDetails = text
      .replace(/log my work/gi, '')
      .replace(/log/gi, '')
      .replace(/for project [a-zA-Z0-9_-]+/gi, '')
      .replace(/for [a-zA-Z0-9_-]+/gi, '')
      .replace(/I worked on/gi, '')
      .replace(/tasks completed today/gi, '')
      .trim();

    // If it's empty because the user just said "log my work", leave it empty
    if (taskDetails.length < 3) taskDetails = '';

    return {
      response: projectName 
        ? `I have prepared a new log entry for the ${projectName} project. Should I open the logger?`
        : `I've opened the logger for you. What project did you work on?`,
      payload: {
        intent: 'log_work',
        projectName: projectName,
        taskDetails: taskDetails
      }
    };
  }

  // Fallback
  return {
    response: "I'm your simulated AI Copilot! Try saying 'Log my work for Project Alpha' or 'Go to dashboard'.",
    payload: null
  };
}
