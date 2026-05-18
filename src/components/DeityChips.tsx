import { useApp } from '../context/useApp';
import { DEITIES, DEITY_ICON, i18n, type Deity } from '../i18n';

type Props = {
  value: Deity | null;
  onChange: (d: Deity) => void;
};

export function DeityChips({ value, onChange }: Props) {
  const { language } = useApp();
  const copy = i18n[language];

  return (
    <div className="deity-chips" role="listbox" aria-label={copy.choosePath}>
      {DEITIES.map((d) => (
        <button
          key={d}
          type="button"
          role="option"
          aria-selected={value === d}
          className="deity-chip"
          data-selected={value === d ? 'true' : undefined}
          onClick={() => onChange(d)}
        >
          <span className="deity-chip__glyph" aria-hidden>
            {DEITY_ICON[d]}
          </span>
          <span className="deity-chip__text">
            <span className="deity-chip__label">{copy.labels[d]}</span>
            <span className="deity-chip__sub">{copy.subs[d]}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
