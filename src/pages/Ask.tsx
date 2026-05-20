import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MAX_MESSAGE_LENGTH, PENDING_KEY } from '../config';
import { useApp } from '../context/useApp';
import { DeityChips } from '../components/DeityChips';
import { HeavenlyWriting } from '../components/HeavenlyWriting';
import { i18n, t, type Deity } from '../i18n';

const SEND_RITUAL_MS = 680;

export function Ask() {
  const navigate = useNavigate();
  const { language, deity, setDeity, questionsLeft, hasWebhook } = useApp();
  const copy = i18n[language];

  const [message, setMessage] = useState('');
  const [localDeity, setLocalDeity] = useState<Deity | null>(deity);
  const [sending, setSending] = useState(false);

  const len = message.length;
  const canSend =
    message.trim().length > 0 &&
    localDeity !== null &&
    questionsLeft > 0 &&
    hasWebhook &&
    len <= MAX_MESSAGE_LENGTH &&
    !sending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || !localDeity) return;

    setDeity(localDeity);
    sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({
        message: message.trim(),
        language,
        deity: localDeity,
      }),
    );
    setSending(true);
    window.setTimeout(() => navigate('/reveal'), SEND_RITUAL_MS);
  };

  if (sending) {
    return (
      <article className="page page--ask page--sending" aria-live="polite">
        <div className="send-ritual">
          <HeavenlyWriting label={copy.sendingRitual} compact />
          <p className="send-ritual__eyebrow">{copy.sendingRitual}</p>
          <p className="send-ritual__preview">{message.trim()}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="page page--ask fade-in">
      <Link to="/" className="back-link">
        ← {copy.backHome}
      </Link>

      {!hasWebhook ? (
        <p className="banner banner--warn banner--compact">{t(language, 'errorNoWebhook')}</p>
      ) : null}

      {questionsLeft === 0 ? (
        <p className="banner banner--warn banner--compact">{t(language, 'noQuestions')}</p>
      ) : null}

      <form className="ask-block" onSubmit={onSubmit}>
        <div className="ask-frame">
          <h1 className="ask-heading">{copy.askTitle}</h1>

          <fieldset className="ask-fieldset">
            <legend className="ask-legend">{copy.choosePath}</legend>
            <DeityChips
              value={localDeity}
              onChange={(d) => {
                setLocalDeity(d);
                setDeity(d);
              }}
            />
          </fieldset>

          <textarea
            id="question"
            className="ask-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder={copy.yourQuestion}
            rows={4}
            disabled={questionsLeft === 0}
            aria-label={copy.askTitle}
          />
          <div className="ask-meta">
            <span className="char-count" data-warn={len > MAX_MESSAGE_LENGTH * 0.9 ? 'true' : undefined}>
              {len} / {MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>

        <div className="ask-actions">
          <button type="submit" className="btn btn--primary btn--wide" disabled={!canSend}>
            {copy.sendQuestion}
          </button>
        </div>
      </form>
    </article>
  );
}
