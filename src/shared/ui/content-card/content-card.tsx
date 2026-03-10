import Image from 'next/image';
import { css } from 'styled-system/css';

import { Link } from '@/i18n/navigation';

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
  borderTopLeftRadius: '3xl',
  borderTopRightRadius: '3xl',
  overflow: 'hidden',
  borderBottom: '[1px solid var(--colors-border)]',
  backgroundColor: 'surfaceStrong',
});

const thumbnailClass = css({
  width: 'full',
  height: 'full',
  aspectRatio: '[16 / 9]',
  objectFit: 'cover',
  transition: 'transform',
  '[data-content-card="true"]:hover &': {
    transform: '[scale(1.03)]',
  },
  '[data-content-card="true"]:focus-visible &': {
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
  fontSize: 'sm',
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
  borderRadius: 'full',
  backgroundColor: 'textSubtle',
  color: 'muted',
  fontSize: 'xs',
});

const bodyClass = css({
  display: 'grid',
  minWidth: '0',
  gap: '3',
});

const titleClass = css({
  lineClamp: '2',
  fontSize: 'xl',
  lineHeight: 'tight',
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
  <Link
    aria-label={ariaLabel}
    className={contentCardLinkClass}
    data-content-card="true"
    href={href}
  >
    <article className={contentCardRecipe}>
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

const contentCardRecipe = css({
  minHeight: '[19rem]',
  height: 'full',
  display: 'grid',
  alignContent: 'start',
  gap: '0',
  borderRadius: '3xl',
  border: '[1px solid var(--colors-border)]',
  backgroundColor: 'surfaceMuted',
  overflow: 'hidden',
  transition: '[box-shadow 220ms ease, transform 220ms ease]',
  '[data-content-card="true"]:hover &': {
    boxShadow: '[0 4px 16px rgb(15 23 42 / 0.14)]',
    transform: '[translateY(-3px)]',
  },
  '[data-content-card="true"]:focus-visible &': {
    boxShadow: '[0 4px 16px rgb(15 23 42 / 0.14)]',
    transform: '[translateY(-3px)]',
  },
});

const contentCardLinkClass = css({
  display: 'block',
  height: 'full',
  textDecoration: 'none',
  color: 'text',
});
