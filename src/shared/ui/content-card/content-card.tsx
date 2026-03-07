'use client';

import { css } from '@emotion/react';
import Image from 'next/image';

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
  <Link aria-label={ariaLabel} href={href} css={cardLinkStyle}>
    <article css={cardStyle}>
      {thumbnailSrc ? (
        <div css={thumbnailWrapStyle}>
          <Image
            alt={thumbnailAlt}
            height={720}
            src={thumbnailSrc}
            css={thumbnailStyle}
            width={1280}
          />
        </div>
      ) : null}
      <div css={contentStyle}>
        <div css={metaStyle}>
          {metaItems.map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
        {tags && tags.length > 0 ? (
          <div css={tagsStyle}>
            {tags.map(tag => (
              <span key={tag} css={tagStyle}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div css={bodyStyle}>
          <h3 css={titleStyle}>{title}</h3>
          {description ? <p css={descriptionStyle}>{description}</p> : null}
        </div>
      </div>
    </article>
  </Link>
);

const cardStyle = css`
  min-height: 19rem;
  height: 100%;
  display: grid;
  align-content: start;
  gap: 0;
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.22);
  background-color: rgb(var(--color-surface-muted) / 0.5);
  overflow: hidden;
  transition:
    box-shadow 220ms ease,
    transform 220ms ease;

  &:hover,
  &:focus-visible {
    box-shadow: 0 4px 16px rgb(var(--color-black) / 0.14);
    transform: translateY(-1px);
  }
`;

const thumbnailWrapStyle = css`
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  overflow: hidden;
  border-bottom: 1px solid rgb(var(--color-border) / 0.2);
  background-color: rgb(var(--color-surface-strong) / 0.58);
`;

const thumbnailStyle = css`
  width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  transition: transform 280ms ease;

  a:hover & {
    transform: scale(1.03);
  }
`;

const contentStyle = css`
  display: grid;
  gap: var(--space-3);
  padding: var(--space-6);
`;

const metaStyle = css`
  display: flex;
  flex-wrap: nowrap;
  gap: var(--space-3);
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

const tagsStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const tagStyle = css`
  display: inline-flex;
  align-items: center;
  min-height: 1.75rem;
  padding: var(--space-0) var(--space-2);
  border-radius: var(--radius-pill);
  background-color: rgb(var(--color-text) / 0.06);
  color: rgb(var(--color-muted));
  font-size: var(--font-size-12);
`;

const bodyStyle = css`
  display: grid;
  min-width: 0;
  gap: var(--space-3);
`;

const titleStyle = css`
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: var(--font-size-20);
  line-height: var(--line-height-120);
  letter-spacing: -0.03em;
`;

const descriptionStyle = css`
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: rgb(var(--color-muted));
`;

const cardLinkStyle = css`
  display: block;
  height: 100%;
  text-decoration: none;
  color: rgb(var(--color-text));
`;
