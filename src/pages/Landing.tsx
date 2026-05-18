import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TELEGRAM_BOT_URL } from '../config';
import { useApp } from '../context/useApp';
import { i18n, t } from '../i18n';

export function Landing() {
  const { language } = useApp();
  const copy = i18n[language];
  const [howOpen, setHowOpen] = useState(false);

  return (
    <article className="page page--landing fade-in">
      <p className="eyebrow">{copy.tagline}</p>
      <h1 className="hero-title">{copy.siteName}</h1>
      <p className="hero-lead">{copy.landingSub}</p>
      <p className="hero-note">{copy.welcomeIntro1}</p>

      <div className="cta-stack">
        <Link to="/ask" className="btn btn--primary">
          {copy.ctaReceive}
        </Link>
        <a href={TELEGRAM_BOT_URL} className="btn btn--secondary" target="_blank" rel="noreferrer">
          {copy.ctaTelegram}
        </a>
        <Link to="/browse" className="btn btn--ghost">
          {copy.ctaBrowse}
        </Link>
      </div>

      <details
        className="how-it-works"
        open={howOpen}
        onToggle={(e) => setHowOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary>{t(language, 'howItWorksTitle')}</summary>
        <ol>
          <li>{t(language, 'howItWorks1')}</li>
          <li>{t(language, 'howItWorks2')}</li>
          <li>{t(language, 'howItWorks3')}</li>
        </ol>
      </details>
    </article>
  );
}
