'use client';

import { css } from '@emotion/react';

import type { ProjectListItem } from '@/entities/project/model/types';
import { ProjectCard } from '@/entities/project/ui/project-card';
import { srOnlyStyle } from '@/shared/ui/styles/sr-only-style';

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
  <section css={sectionStyle}>
    {hideHeader ? null : (
      <div css={headerStyle}>
        <h2 css={titleStyle}>{title}</h2>
        <p css={descriptionVisibility === 'sr-only' ? srOnlyStyle : descriptionStyle}>
          {description}
        </p>
      </div>
    )}
    {items.length > 0 ? (
      <div css={gridStyle}>
        {items.map(item => (
          <ProjectCard item={item} key={`${item.id}-${item.created_at}`} />
        ))}
      </div>
    ) : (
      <p css={emptyStyle}>{emptyText}</p>
    )}
  </section>
);

const sectionStyle = css`
  display: grid;
  gap: var(--space-4);
`;

const headerStyle = css`
  display: grid;
  gap: var(--space-3);
`;

const titleStyle = css`
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: var(--line-height-96);
  letter-spacing: -0.04em;
`;

const descriptionStyle = css`
  max-width: 52rem;
  color: rgb(var(--color-muted));
`;

const gridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  grid-auto-rows: 1fr;
  align-items: stretch;
  gap: var(--space-4);
`;

const emptyStyle = css`
  color: rgb(var(--color-muted));
  padding: var(--space-4) var(--space-0);
`;
