import { Link, Outlet } from 'react-router-dom';
import { useApp } from '../context/useApp';
import { i18n, t } from '../i18n';
import { LanguageToggle } from './LanguageToggle';

export function Layout() {
  const { language, questionsLeft } = useApp();
  const copy = i18n[language];

  const quotaLabel =
    questionsLeft === 0
      ? t(language, 'noQuestions')
      : questionsLeft === 1
        ? t(language, 'questionLeft')
        : t(language, 'questionsLeft', questionsLeft);

  return (
    <div className="shell">
      <header className="site-header">
        <Link to="/" className="site-logo">
          {copy.siteName}
        </Link>
        <div className="site-header__end">
          <span className="quota" data-low={questionsLeft <= 1 ? 'true' : undefined}>
            {quotaLabel}
          </span>
          <LanguageToggle />
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p className="site-footer__line">{t(language, 'footerLimit')}</p>
        <p className="site-footer__muted">{t(language, 'footerDisclaimer')}</p>
      </footer>
    </div>
  );
}
