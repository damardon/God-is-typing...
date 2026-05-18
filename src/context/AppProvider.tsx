import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { MAX_QUESTIONS, getWebhookUrl } from '../config';
import { getClientFingerprint } from '../fingerprint';
import type { Deity, Lang } from '../i18n';
import {
  generateSessionId,
  loadPersisted,
  savePersisted,
  type Persisted,
} from '../lib/session';
import { AppContext, type AppContextValue } from './appContext';

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [language, setLanguageState] = useState<Lang>('es');
  const [deity, setDeityState] = useState<Deity | null>(null);
  const [ipHash, setIpHash] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [questionsToday, setQuestionsToday] = useState(0);
  const [lastResetAt, setLastResetAt] = useState(() => Date.now());

  const hasWebhook = Boolean(getWebhookUrl());
  const questionsLeft = Math.max(0, MAX_QUESTIONS - questionsToday);

  const persist = useCallback(
    (patch: Partial<Persisted>) => {
      const next: Persisted = {
        language: patch.language ?? language,
        deity: patch.deity !== undefined ? patch.deity : deity,
        questionsToday: patch.questionsToday ?? questionsToday,
        lastResetAt: patch.lastResetAt ?? lastResetAt,
      };
      savePersisted(next);
    },
    [language, deity, questionsToday, lastResetAt],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const p = loadPersisted();
      const fp = await getClientFingerprint();
      if (cancelled) return;
      setIpHash(fp);
      setSessionId(generateSessionId());
      setQuestionsToday(p.questionsToday);
      setLastResetAt(p.lastResetAt);
      if (p.language) setLanguageState(p.language);
      if (p.deity) setDeityState(p.deity);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready) {
      document.documentElement.lang = language;
    }
  }, [language, ready]);

  const setLanguage = useCallback(
    (lang: Lang) => {
      setLanguageState(lang);
      persist({ language: lang });
    },
    [persist],
  );

  const setDeity = useCallback(
    (d: Deity | null) => {
      setDeityState(d);
      persist({ deity: d });
    },
    [persist],
  );

  const recordQuestion = useCallback(() => {
    const nextCount = questionsToday + 1;
    const nextReset = questionsToday === 0 ? Date.now() : lastResetAt;
    setQuestionsToday(nextCount);
    setLastResetAt(nextReset);
    persist({ questionsToday: nextCount, lastResetAt: nextReset });
  }, [questionsToday, lastResetAt, persist]);

  const setQuestionsBlocked = useCallback(() => {
    setQuestionsToday(MAX_QUESTIONS);
    persist({ questionsToday: MAX_QUESTIONS });
  }, [persist]);

  const newSession = useCallback(() => {
    setSessionId(generateSessionId());
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      language,
      deity,
      ipHash,
      sessionId,
      questionsToday,
      questionsLeft,
      hasWebhook,
      setLanguage,
      setDeity,
      recordQuestion,
      setQuestionsBlocked,
      newSession,
    }),
    [
      ready,
      language,
      deity,
      ipHash,
      sessionId,
      questionsToday,
      questionsLeft,
      hasWebhook,
      setLanguage,
      setDeity,
      recordQuestion,
      setQuestionsBlocked,
      newSession,
    ],
  );

  if (!ready) {
    return (
      <div className="shell shell--loading">
        <p className="loading-pulse">god is typing</p>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
