import React from 'react';
import { css, cx } from 'styled-system/css';

import { Link } from '@/i18n/navigation';

type PaginationLinksProps = {
  ariaLabel: string;
  className?: string;
  nextHref: string | null;
  nextText: string;
  previousHref: string | null;
  previousText: string;
};

/**
 * 크롤러가 따라갈 수 있는 이전/다음 페이지 링크를 렌더링합니다.
 */
export const PaginationLinks = ({
  ariaLabel,
  className,
  nextHref,
  nextText,
  previousHref,
  previousText,
}: PaginationLinksProps) => {
  if (!previousHref && !nextHref) return null;

  return (
    <nav aria-label={ariaLabel} className={cx(containerClass, className)}>
      {previousHref ? (
        <Link className={linkClass} href={previousHref}>
          {previousText}
        </Link>
      ) : (
        <span aria-hidden className={placeholderClass} />
      )}
      {nextHref ? (
        <Link className={linkClass} href={nextHref}>
          {nextText}
        </Link>
      ) : (
        <span aria-hidden className={placeholderClass} />
      )}
    </nav>
  );
};

const containerClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  mt: '4',
});

const linkClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '10',
  px: '4',
  borderRadius: 'full',
  border: '[1px solid var(--colors-border)]',
  color: 'text',
  textDecoration: 'none',
  _hover: {
    background: 'surface',
    color: 'primary',
    borderColor: 'primary',
  },
  _focusVisible: {
    outline: '[2px solid var(--colors-primary)]',
    outlineOffset: '[2px]',
  },
});

const placeholderClass = css({
  display: 'block',
  minHeight: '10',
  minWidth: '[5rem]',
});
