import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MAX_MESSAGE_LENGTH, PENDING_KEY } from '../config';
import { useApp } from '../context/useApp';
import { DeityChips } from '../components/DeityChips';
import { i18n, t, type Deity } from '../i18n';

export function Ask() {
  const navigate = useNavigate();
  const { language, deity, setDeity, questionsLeft, hasWebhook } = useApp();
  const copy = i18n[language];

  const [message, setMessage] = useState('');
  const [localDeity, setLocalDeity] = useState<Deity | null>(deity);

  const len = message.length;
  const canSend =
    message.trim().length > 0 &&
    localDeity !== null &&
    questionsLeft > 0 &&
    hasWebhook &&
    len <= MAX_MESSAGE_LENGTH;

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
    navigate('/reveal');
  };

  return (
    <article className="page page--ask fade-in">
      <Link to="/" className="back-link">
        ← {copy.backHome}
      </Link>

      <h1 className="page-title">{copy.askTitle}</h1>
      <p className="page-lead">{copy.askSubtitle}</p>

      {!hasWebhook ? (
        <p className="banner banner--warn">{t(language, 'errorNoWebhook')}</p>
      ) : null}

      {questionsLeft === 0 ? (
        <p className="banner banner--warn">{t(language, 'noQuestions')}</p>
      ) : null}

      <form className="ask-form" onSubmit={onSubmit}>
        <fieldset className="ask-fieldset">
          <legend>{copy.choosePath}</legend>
          <DeityChips
            value={localDeity}
            onChange={(d) => {
              setLocalDeity(d);
              setDeity(d);
            }}
          />
        </fieldset>

        <label className="ask-label" htmlFor="question">
          {copy.yourQuestion}
        </label>
        <textarea
          id="question"
          className="ask-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          placeholder={copy.yourQuestion}
          rows={5}
          disabled={questionsLeft === 0}
        />
        <div className="ask-meta">
          <span className="char-count" data-warn={len > MAX_MESSAGE_LENGTH * 0.9 ? 'true' : undefined}>
            {len} / {MAX_MESSAGE_LENGTH}
          </span>
        </div>

        <button type="submit" className="btn btn--primary btn--wide" disabled={!canSend}>
          {copy.sendQuestion}
        </button>
      </form>
    </article>
  );
}
