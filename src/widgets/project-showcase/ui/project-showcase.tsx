import { css } from 'styled-system/css';

import type { ProjectListItem } from '@/entities/project/model/types';
import { ProjectCard } from '@/entities/project/ui/project-card';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type ProjectShowcaseHeader = Readonly<{
  readonly description?: string;
  readonly title: string;
}>;

/**
 * 프로젝트 카드 그리드 위젯의 입력 계약입니다.
 *
 * @property emptyText - 카드가 하나도 없을 때 대신 노출할 안내 문구입니다.
 * @property header - 화면에 실제로 보이는 제목/설명 헤더입니다. 없으면 헤더를 렌더하지 않습니다.
 * @property items - 카드로 렌더할 프로젝트 목록입니다.
 * @property srOnlyHeader - 시각적으로는 숨기되 스크린리더에는 남겨둘 제목/설명입니다.
 *   `title`은 필수이며, `description`은 선택값입니다.
 */
type ProjectShowcaseProps = {
  emptyText: string;
  header?: ProjectShowcaseHeader;
  items: ProjectListItem[];
  srOnlyHeader?: ProjectShowcaseHeader;
};

/** 프로젝트 카드 묶음을 노출하는 위젯입니다. */
export const ProjectShowcase = ({
  emptyText,
  header,
  items,
  srOnlyHeader,
}: ProjectShowcaseProps) => (
  <section className={sectionClass}>
    {header ? (
      <div className={headerClass}>
        <h2 className={titleClass}>{header.title}</h2>
        {header.description ? <p className={descriptionClass}>{header.description}</p> : null}
      </div>
    ) : null}
    {srOnlyHeader ? (
      <div className={srOnlyClass}>
        <h2>{srOnlyHeader.title}</h2>
        {srOnlyHeader.description ? <p>{srOnlyHeader.description}</p> : null}
      </div>
    ) : null}
    {items.length > 0 ? (
      <div className={gridClass}>
        {items.map(item => (
          <ProjectCard item={item} key={item.id} />
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
