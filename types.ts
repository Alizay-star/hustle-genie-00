// Fix: Import `ReactNode` to be used in the ChatMessage interface and resolve the 'Cannot find namespace React' error.
import type { ReactNode } from 'react';

export type Theme = 'default' | 'light' | 'dark' | 'red' | 'green' | 'blue' | 'purple';
export type FontTheme = 'nunito' | 'inter' | 'lora' | 'mono' | 'poppins' | 'playfair' | 'source-code-pro';

export interface Settings {
  theme: Theme;
  font: FontTheme;
  personality: string;
}

export interface HustleGoal {
  title: string;
  current: number;
  goal: number;
  imageUrl?: string;
}

export interface WishFormData {
  skills: string;
  time: string;
  location: 'Online' | 'Local' | 'Hybrid';
  goal: string;
}

export interface HustleIdea {
  title: string;
  description: string;
  timeCommitment: string;
  estimatedEarnings: string;
  hustleSteps: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  // For user messages, `text` will be used.
  // For model messages, `responses` will be used. `text` and `imageUrl` are kept for temporary backward compatibility.
  text?: ReactNode;
  imageUrl?: string;
  // For model messages, we store all generated responses to allow navigation.
  responses?: {
    text?: ReactNode;
    imageUrl?: string;
    isTyping?: boolean;
  }[];
  activeResponseIndex?: number;
  isInitial?: boolean;
  isPinned?: boolean;
  isPending?: boolean;
  reactions?: string[];
}


export interface ChatHistoryItem {
    id: string;
    title: string;
    date: string;
    messages: ChatMessage[];
    isPinned?: boolean;
}

export interface PlanDay {
  day: number;
  title:string;
  tasks: string[];
}

export interface LaunchPlan {
  plan: PlanDay[];
}