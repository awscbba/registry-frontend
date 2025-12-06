import type { Project } from '../types/project';
import ProjectCard from './ProjectCard';
import ProjectPagination from './ProjectPagination';
import ViewModeControls from './ViewModeControls';
import styles from './ProjectShowcase.module.css';

type ViewMode = 'cards' | 'list' | 'icons';

interface ProjectsSectionProps {
  title: string;
  description: string;
  projects: Project[];
  viewMode: ViewMode;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isOngoing?: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onSubscribeClick: (project: Project) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onPageChange: (page: number) => void;
}

export default function ProjectsSection({
  title,
  description,
  projects,
  viewMode,
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  isOngoing = false,
  onViewModeChange,
  onSubscribeClick,
  onNextPage,
  onPreviousPage,
  onPageChange,
}: ProjectsSectionProps) {
  return (
    <div className={`${styles.projectsSection} ${isOngoing ? styles.ongoingSection : ''}`}>
      <div className={styles.projectsHeader}>
        <div className={styles.headerTitle}>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        
        {!isOngoing && <ViewModeControls viewMode={viewMode} onViewModeChange={onViewModeChange} />}
      </div>
      
      <div className={`${styles.projectsDisplay} ${styles[viewMode]} ${isOngoing ? styles.ongoing : ''}`}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            viewMode={viewMode}
            onSubscribeClick={onSubscribeClick}
            isOngoing={isOngoing}
          />
        ))}
      </div>

      <ProjectPagination
        currentPage={currentPage}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        onNextPage={onNextPage}
        onPreviousPage={onPreviousPage}
        onPageChange={onPageChange}
      />
    </div>
  );
}
