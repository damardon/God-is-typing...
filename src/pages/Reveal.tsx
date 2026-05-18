import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postAsk } from '../api';
import { getWebhookUrl, MIN_TYPING_MS, PENDING_KEY } from '../config';
import { useApp } from '../context/useApp';
import { i18n, t, type Deity, type Lang } from '../i18n';

type Pending = {
  message: string;
  language: Lang;
  deity: Deity;
};

type Phase = 'typing' | 'letter' | 'blocked' | 'error';

function readPending(): Pending | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Pending;
    if (!parsed.message || !parsed.deity) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function Reveal() {
  const navigate = useNavigate();
  const {
    language,
    ipHash,
    sessionId,
    hasWebhook,
    recordQuestion,
    setQuestionsBlocked,
    newSession,
  } = useApp();
  const copy = i18n[language];

  const [pending] = useState(readPending);
  const [phase, setPhase] = useState<Phase>('typing');
  const [response, setResponse] = useState('');
  const [citation, setCitation] = useState('');
  const [blockedMsg, setBlockedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const webhookUrl = getWebhookUrl();

  useEffect(() => {
    if (!pending) {
      navigate('/ask', { replace: true });
    }
  }, [pending, navigate]);

  useEffect(() => {
    if (!pending || !ipHash || !hasWebhook || !webhookUrl) return;

    let cancelled = false;
    const started = Date.now();

    void (async () => {
      try {
        const data = await postAsk(webhookUrl, {
          message: pending.message,
          language: pending.language,
          deity: pending.deity,
          sessionId,
          ipHash,
        });

        const elapsed = Date.now() - started;
        if (elapsed < MIN_TYPING_MS) {
          await new Promise((r) => setTimeout(r, MIN_TYPING_MS - elapsed));
        }
        if (cancelled) return;

        sessionStorage.removeItem(PENDING_KEY);

        if (data.blocked) {
          setBlockedMsg(data.message);
          setQuestionsBlocked();
          setPhase('blocked');
          return;
        }

        setResponse(data.response);
        setCitation(data.citation ?? '');
        recordQuestion();
        newSession();
        setPhase('letter');
      } catch (err) {
        if (cancelled) return;
        const code = err instanceof Error ? err.message : '';
        const key =
          code === 'http_404' ? 'errorWebhookInactive' : code === 'network' ? 'errorNetwork' : 'errorGeneric';
        setErrorMsg(t(language, key));
        setPhase('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    pending,
    ipHash,
    sessionId,
    hasWebhook,
    webhookUrl,
    language,
    recordQuestion,
    setQuestionsBlocked,
    newSession,
  ]);

  if (!pending) {
    return (
      <article className="page page--reveal page--reveal-center">
        <p className="reveal-wait">{copy.revealWaiting}</p>
      </article>
    );
  }

  if (!hasWebhook || !webhookUrl) {
    return (
      <article className="page page--reveal fade-in">
        <div className="letter letter--warn">
          <p className="letter__body">{t(language, 'errorNoWebhook')}</p>
        </div>
        <div className="reveal-actions">
          <Link to="/ask" className="btn btn--secondary">
            {copy.backHome}
          </Link>
        </div>
      </article>
    );
  }

  const pathLabel = copy.labels[pending.deity];

  return (
    <article className="page page--reveal">
      {phase === 'typing' ? (
        <div className="reveal-stage reveal-stage--typing fade-in">
          <p className="reveal-eyebrow">{copy.revealWaiting}</p>
          <h1 className="reveal-typing">
            {copy.revealTyping}
            <span className="dots" aria-hidden>
              …
            </span>
          </h1>
        </div>
      ) : null}

      {phase === 'letter' ? (
        <div className="reveal-stage fade-in-up">
          <p className="reveal-eyebrow">{pathLabel}</p>
          <div className="letter">
            <p className="letter__body">{response}</p>
            {citation ? (
              <blockquote className="letter__citation">
                <cite>{citation}</cite>
              </blockquote>
            ) : null}
          </div>
          <div className="letter__question">
            <span className="letter__question-label">{copy.yourQuestionLabel}</span>
            <p>{pending.message}</p>
          </div>
          <div className="reveal-actions">
            <Link to="/ask" className="btn btn--primary">
              {copy.anotherQuestion}
            </Link>
            <Link to="/ask" className="btn btn--ghost">
              {copy.changePath}
            </Link>
            <Link to="/" className="btn btn--ghost">
              {copy.backHome}
            </Link>
          </div>
        </div>
      ) : null}

      {phase === 'blocked' ? (
        <div className="reveal-stage fade-in">
          <div className="letter letter--warn">
            <p className="letter__body">{blockedMsg}</p>
          </div>
          <div className="reveal-actions">
            <Link to="/" className="btn btn--secondary">
              {copy.backHome}
            </Link>
          </div>
        </div>
      ) : null}

      {phase === 'error' ? (
        <div className="reveal-stage fade-in">
          <div className="letter letter--warn">
            <p className="letter__body">{errorMsg}</p>
          </div>
          <div className="reveal-actions">
            <Link to="/ask" className="btn btn--primary">
              {copy.anotherQuestion}
            </Link>
          </div>
        </div>
      ) : null}
    </article>
  );
}
