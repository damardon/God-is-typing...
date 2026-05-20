import { Link } from 'react-router-dom';
import { CelestialLogo } from '../components/CelestialLogo';
import { useApp } from '../context/useApp';
import { i18n } from '../i18n';

export function Browse() {
  const { language } = useApp();
  const copy = i18n[language];

  return (
    <article className="page page--browse fade-in">
      <Link to="/" className="back-link">
        ← {copy.backHome}
      </Link>
      <div className="browse-panel">
        <CelestialLogo size="md" className="browse-panel__logo" />
        <h1 className="page-title">{copy.browseTitle}</h1>
        <p className="page-lead">{copy.browseSoon}</p>
        <Link to="/ask" className="btn btn--primary btn--wide">
          {copy.ctaReceive}
        </Link>
      </div>
    </article>
  );
}
