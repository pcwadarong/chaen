import { css, cx } from 'styled-system/css';

import type { ProjectListItem } from '@/entities/project/model/types';
import { ProjectCard } from '@/entities/project/ui/project-card';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type ProjectShowcaseProps = {
  description?: string;
  descriptionVisibility?: 'sr-only' | 'visible';
  emptyText: string;
  items: ProjectListItem[];
  hideHeader?: boolean;
  title?: string;
};

/** 프로젝트 카드 묶음을 노출하는 위젯입니다. */
export const ProjectShowcase = ({
  description = '',
  descriptionVisibility = 'visible',
  emptyText,
  hideHeader = false,
  items,
  title = '',
}: ProjectShowcaseProps) => (
  <section className={sectionClass}>
    {hideHeader ? null : (
      <div className={headerClass}>
        <h2 className={titleClass}>{title}</h2>
        <p
          className={cx(
            descriptionVisibility === 'visible' ? descriptionClass : undefined,
            descriptionVisibility === 'sr-only' ? srOnlyClass : undefined,
          )}
        >
          {description}
        </p>
      </div>
    )}
    {items.length > 0 ? (
      <div className={gridClass}>
        {items.map(item => (
          <ProjectCard item={item} key={`${item.id}-${item.created_at}`} />
        ))}
      </div>
    ) : (
      <p className={emptyClass}>{emptyText}</p>
    )}
  </section>
);

const sectionClass = css({
  display: 'grid',
  gap: '4',
});

const headerClass = css({
  display: 'grid',
  gap: '3',
});

const titleClass = css({
  fontSize: '[clamp(2rem, 4vw, 3.25rem)]',
  lineHeight: 'none',
  letterSpacing: '[-0.04em]',
});

const descriptionClass = css({
  maxWidth: '[52rem]',
  color: 'muted',
});

const gridClass = css({
  display: 'grid',
  gridTemplateColumns: '[repeat(auto-fit, minmax(260px, 1fr))]',
  gridAutoRows: '[1fr]',
  alignItems: 'stretch',
  gap: '4',
});

const emptyClass = css({
  color: 'muted',
  py: '4',
});
