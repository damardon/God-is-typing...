import { STORAGE_KEY, WINDOW_HOURS } from '../config';
import type { Deity, Lang } from '../i18n';

export type Persisted = {
  language: Lang | null;
  deity: Deity | null;
  questionsToday: number;
  lastResetAt: number;
};

export function generateSessionId(): string {
  return `sess_${Math.random().toString(36).slice(2, 15)}${Date.now().toString(36)}`;
}

export function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { language: null, deity: null, questionsToday: 0, lastResetAt: Date.now() };
    }
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    const now = Date.now();
    const windowMs = WINDOW_HOURS * 60 * 60 * 1000;
    let questionsToday = typeof parsed.questionsToday === 'number' ? parsed.questionsToday : 0;
    let lastResetAt = typeof parsed.lastResetAt === 'number' ? parsed.lastResetAt : now;
    if (now - lastResetAt > windowMs) {
      questionsToday = 0;
      lastResetAt = now;
    }
    const language = parsed.language === 'en' || parsed.language === 'es' ? parsed.language : null;
    const deity =
      parsed.deity &&
      (['jewish', 'christian', 'buddhist', 'olympus', 'future_self'] as const).includes(
        parsed.deity as Deity,
      )
        ? (parsed.deity as Deity)
        : null;
    return { language, deity, questionsToday, lastResetAt };
  } catch {
    return { language: null, deity: null, questionsToday: 0, lastResetAt: Date.now() };
  }
}

export function savePersisted(p: Persisted): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}
