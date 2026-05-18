import { createContext } from 'react';
import type { Deity, Lang } from '../i18n';

export type AppContextValue = {
  ready: boolean;
  language: Lang;
  deity: Deity | null;
  ipHash: string | null;
  sessionId: string;
  questionsToday: number;
  questionsLeft: number;
  hasWebhook: boolean;
  setLanguage: (lang: Lang) => void;
  setDeity: (d: Deity | null) => void;
  recordQuestion: () => void;
  setQuestionsBlocked: () => void;
  newSession: () => void;
};

export const AppContext = createContext<AppContextValue | null>(null);
