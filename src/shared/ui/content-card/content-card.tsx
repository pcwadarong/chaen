import Image from 'next/image';
import { css } from 'styled-system/css';

import { Link } from '@/i18n/navigation';

type ContentCardProps = {
  ariaLabel: string;
  description?: string | null;
  href: string;
  locale?: string;
  metaItems: string[];
  thumbnailAlt: string;
  thumbnailSrc: string | null;
  title: string;
};

const thumbnailWrapClass = css({
  position: 'relative',
  aspectRatio: '[16 / 9]',
  borderTopLeftRadius: '3xl',
  borderTopRightRadius: '3xl',
  overflow: 'hidden',
  borderBottom: '[1px solid var(--colors-border)]',
  backgroundColor: 'surfaceStrong',
});

const thumbnailClass = css({
  width: 'full',
  height: 'full',
  objectFit: 'cover',
  transition: 'transform',
  '[data-content-card="true"]:hover &': {
    transform: '[scale(1.03)]',
  },
  '[data-content-card="true"]:focus-visible &': {
    transform: '[scale(1.03)]',
  },
});

const thumbnailPlaceholderClass = css({
  width: 'full',
  height: 'full',
  backgroundColor: 'surfaceStrong',
  opacity: '0.65',
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
  '&:lang(ja)': {
    wordBreak: 'break-all',
    overflowWrap: 'anywhere',
  },
});

const descriptionClass = css({
  lineClamp: '2',
  color: 'muted',
  '&:lang(ja)': {
    wordBreak: 'break-all',
    overflowWrap: 'anywhere',
  },
});

/**
 * 프로젝트/기록 목록에서 공통으로 사용하는 미디어 카드입니다.
 */
export const ContentCard = ({
  ariaLabel,
  description,
  href,
  locale,
  metaItems,
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
      <div className={thumbnailWrapClass}>
        {thumbnailSrc ? (
          <Image
            alt={thumbnailAlt}
            className={thumbnailClass}
            height={720}
            src={thumbnailSrc}
            width={1280}
          />
        ) : (
          <div aria-hidden="true" className={thumbnailPlaceholderClass} />
        )}
      </div>
      <div className={contentClass}>
        <div className={metaClass}>
          {metaItems.map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className={bodyClass}>
          <h3 className={titleClass} lang={locale}>
            {title}
          </h3>
          {description ? (
            <p className={descriptionClass} lang={locale}>
              {description}
            </p>
          ) : null}
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
    boxShadow: 'floating',
    transform: '[translateY(-3px)]',
  },
  '[data-content-card="true"]:focus-visible &': {
    boxShadow: 'floating',
    transform: '[translateY(-3px)]',
  },
});

const contentCardLinkClass = css({
  display: 'block',
  height: 'full',
  textDecoration: 'none',
  color: 'text',
});
