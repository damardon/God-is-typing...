import { useApp } from '../context/useApp';
import type { Lang } from '../i18n';

export function LanguageToggle() {
  const { language, setLanguage } = useApp();

  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      {(['es', 'en'] as Lang[]).map((code) => (
        <button
          key={code}
          type="button"
          className="lang-toggle__btn"
          data-active={language === code ? 'true' : undefined}
          onClick={() => setLanguage(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
