import Image from 'next/image';
import { css, cx } from 'styled-system/css';

import { Link } from '@/i18n/navigation';
import {
  contentCardLinkClass,
  contentCardRecipe,
} from '@/shared/ui/content-card/content-card.recipe';

type ContentCardProps = {
  ariaLabel: string;
  description?: string | null;
  href: string;
  metaItems: string[];
  tags?: string[];
  thumbnailAlt: string;
  thumbnailSrc: string | null;
  title: string;
};

const thumbnailWrapClass = css({
  borderTopLeftRadius: 'lg',
  borderTopRightRadius: 'lg',
  overflow: 'hidden',
  borderBottom: '[1px solid rgb(var(--color-border) / 0.2)]',
  backgroundColor: '[rgb(var(--color-surface-strong) / 0.58)]',
});

const thumbnailClass = css({
  width: 'full',
  height: 'full',
  aspectRatio: '[16 / 9]',
  objectFit: 'cover',
  transition: 'transform',
  '.group:hover &': {
    transform: '[scale(1.03)]',
  },
});

const contentClass = css({
  display: 'grid',
  gap: '3',
  p: '6',
});

const metaClass = css({
  display: 'flex',
  flexWrap: 'nowrap',
  gap: '3',
  color: 'muted',
  fontSize: '14',
});

const tagsClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

const tagClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '[1.75rem]',
  px: '2',
  py: '0',
  borderRadius: 'pill',
  backgroundColor: '[rgb(var(--color-text) / 0.06)]',
  color: 'muted',
  fontSize: '12',
});

const bodyClass = css({
  display: 'grid',
  minWidth: '0',
  gap: '3',
});

const titleClass = css({
  lineClamp: '2',
  fontSize: '20',
  lineHeight: '120',
  letterSpacing: '[-0.03em]',
});

const descriptionClass = css({
  lineClamp: '2',
  color: 'muted',
});

/**
 * 프로젝트/기록 목록에서 공통으로 사용하는 미디어 카드입니다.
 * 메타(예: 연도)는 항상 렌더링하고, 태그는 전달된 경우에만 선택적으로 노출합니다.
 */
export const ContentCard = ({
  ariaLabel,
  description,
  href,
  metaItems,
  tags,
  thumbnailAlt,
  thumbnailSrc,
  title,
}: ContentCardProps) => (
  <Link aria-label={ariaLabel} className={cx(contentCardLinkClass, 'group')} href={href}>
    <article className={contentCardRecipe()}>
      {thumbnailSrc ? (
        <div className={thumbnailWrapClass}>
          <Image
            alt={thumbnailAlt}
            className={thumbnailClass}
            height={720}
            src={thumbnailSrc}
            width={1280}
          />
        </div>
      ) : null}
      <div className={contentClass}>
        <div className={metaClass}>
          {metaItems.map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
        {tags && tags.length > 0 ? (
          <div className={tagsClass}>
            {tags.map(tag => (
              <span className={tagClass} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className={bodyClass}>
          <h3 className={titleClass}>{title}</h3>
          {description ? <p className={descriptionClass}>{description}</p> : null}
        </div>
      </div>
    </article>
  </Link>
);
