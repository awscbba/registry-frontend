import styles from './ProjectShowcase.module.css';

interface ProjectPaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onPageChange: (page: number) => void;
}

export default function ProjectPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  onPageChange,
}: ProjectPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className={styles.pagination} aria-label="Paginación de proyectos">
      <button
        onClick={onPreviousPage}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && hasPreviousPage) {
            e.preventDefault();
            onPreviousPage();
          }
        }}
        disabled={!hasPreviousPage}
        className={styles.paginationBtn}
        aria-label="Página anterior"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Anterior
      </button>
      
      <div className={styles.paginationNumbers} role="group" aria-label="Números de página">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onPageChange(page);
              }
            }}
            className={`${styles.paginationNumber} ${currentPage === page ? styles.active : ''}`}
            aria-label={`Página ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
      </div>
      
      <button
        onClick={onNextPage}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && hasNextPage) {
            e.preventDefault();
            onNextPage();
          }
        }}
        disabled={!hasNextPage}
        className={styles.paginationBtn}
        aria-label="Página siguiente"
      >
        Siguiente
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}
