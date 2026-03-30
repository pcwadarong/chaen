import type { AdminArticleListItem } from '@/entities/article/model/types';
import type { AdminProjectListItem } from '@/entities/project/model/types';

export type ContentTab = 'articles' | 'projects';
export type VisibilityValue = 'private' | 'public';

export type AdminContentPageProps = {
  articles: AdminArticleListItem[];
  locale?: string;
  onSaveProjectOrder?: (orderedProjectIds: string[]) => Promise<void>;
  onToggleArticleVisibility?: (input: {
    articleId: string;
    articleSlug?: string;
    visibility: VisibilityValue;
  }) => Promise<void>;
  onToggleProjectVisibility?: (input: {
    projectId: string;
    projectSlug?: string;
    visibility: VisibilityValue;
  }) => Promise<void>;
  projects: AdminProjectListItem[];
};
