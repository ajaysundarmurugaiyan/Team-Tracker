export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Question {
  id: number;
  text: string;
  answered: boolean;
}
