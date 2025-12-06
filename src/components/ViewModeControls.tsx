import styles from './ProjectShowcase.module.css';

type ViewMode = 'cards' | 'list' | 'icons';

interface ViewModeControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ViewModeControls({ viewMode, onViewModeChange }: ViewModeControlsProps) {
  return (
    <div className={styles.viewControls} role="group" aria-label="Controles de vista">
      <button
        onClick={() => onViewModeChange('cards')}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onViewModeChange('cards');
          }
        }}
        className={`${styles.viewBtn} ${viewMode === 'cards' ? styles.active : ''}`}
        title="Vista de tarjetas"
        aria-label="Vista de tarjetas"
        aria-pressed={viewMode === 'cards'}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onViewModeChange('list');
          }
        }}
        className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
        title="Vista de lista"
        aria-label="Vista de lista"
        aria-pressed={viewMode === 'list'}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
      <button
        onClick={() => onViewModeChange('icons')}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onViewModeChange('icons');
          }
        }}
        className={`${styles.viewBtn} ${viewMode === 'icons' ? styles.active : ''}`}
        title="Vista de iconos"
        aria-label="Vista de iconos"
        aria-pressed={viewMode === 'icons'}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
    </div>
  );
}
