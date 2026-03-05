import { css } from '@emotion/react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import type { Article } from '@/entities/article/model/types';
import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import { createImageViewerUrl } from '@/shared/lib/url/create-image-viewer-url';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';

type ArticleDetailPageProps = {
  item: Article;
  locale: string;
};

/**
 * 아티클에 연결된 태그 목록을 locale에 맞는 라벨로 변환합니다.
 */
const getArticleTagLabels = (item: Article, locale: string) =>
  (item.tags ?? []).map(tag => getTagLabelByLocale(tag, locale));

/**
 * 아티클 상세 페이지 컨테이너입니다.
 */
export const ArticleDetailPage = async ({ item, locale }: ArticleDetailPageProps) => {
  const t = await getTranslations('ArticleDetail');
  const normalizedThumbnailUrl = normalizeImageUrl(item.thumbnail_url);
  const thumbnailSrc = normalizedThumbnailUrl ? createImageViewerUrl(normalizedThumbnailUrl) : null;
  const tagLabels = getArticleTagLabels(item, locale);
  const publishedDate = item.created_at.slice(0, 10);
  const updatedDate = item.updated_at?.slice(0, 10);

  return (
    <main css={pageStyle}>
      <article css={articleStyle}>
        <header css={heroStyle}>
          <div css={metaStyle}>
            <span>{t('publishedAt', { date: publishedDate })}</span>
            {updatedDate ? <span>{t('updatedAt', { date: updatedDate })}</span> : null}
          </div>
          <h1 css={titleStyle}>{item.title}</h1>
          <p css={descriptionStyle}>{item.description ?? t('emptySummary')}</p>
          <ul aria-label={t('tagSection')} css={tagListStyle}>
            {tagLabels.length > 0 ? (
              tagLabels.map(tagLabel => (
                <li key={tagLabel} css={tagItemStyle}>
                  #{tagLabel}
                </li>
              ))
            ) : (
              <li css={tagItemStyle}>#{t('noTags')}</li>
            )}
          </ul>
        </header>

        <section aria-labelledby="article-thumbnail-heading" css={panelStyle}>
          <h2 id="article-thumbnail-heading" css={sectionTitleStyle}>
            {t('thumbnailSection')}
          </h2>
          {thumbnailSrc ? (
            <div css={thumbnailWrapStyle}>
              <Image
                alt={t('thumbnailAlt', { title: item.title })}
                height={768}
                src={thumbnailSrc}
                css={thumbnailStyle}
                width={1366}
              />
            </div>
          ) : (
            <p css={emptyTextStyle}>{t('emptyThumbnail')}</p>
          )}
        </section>

        <section aria-labelledby="article-content-heading" css={panelStyle}>
          <h2 id="article-content-heading" css={sectionTitleStyle}>
            {t('contentSection')}
          </h2>
          {item.content ? (
            <p css={plainContentStyle}>{item.content}</p>
          ) : (
            <p css={emptyTextStyle}>{t('emptyContent')}</p>
          )}
        </section>
      </article>
    </main>
  );
};

const pageStyle = css`
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 3rem 0 5rem;
`;

const articleStyle = css`
  display: grid;
  gap: 1.25rem;
`;

const heroStyle = css`
  display: grid;
  gap: 0.85rem;
  padding: 1.75rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.24);
  background:
    linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))),
    rgb(var(--color-surface));
`;

const metaStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  color: rgb(var(--color-muted));
  font-size: 0.9rem;
`;

const titleStyle = css`
  font-size: clamp(2.2rem, 5vw, 4.4rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
`;

const descriptionStyle = css`
  color: rgb(var(--color-muted));
  max-width: 70ch;
`;

const tagListStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const tagItemStyle = css`
  padding: 0.25rem 0.7rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.28);
  background-color: rgb(var(--color-surface) / 0.82);
  font-size: 0.85rem;
`;

const panelStyle = css`
  display: grid;
  gap: 0.9rem;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.2);
  background-color: rgb(var(--color-surface) / 0.92);
`;

const sectionTitleStyle = css`
  font-size: 1.2rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
`;

const emptyTextStyle = css`
  color: rgb(var(--color-muted));
`;

const thumbnailWrapStyle = css`
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid rgb(var(--color-border) / 0.2);
  background-color: rgb(var(--color-surface-strong) / 0.36);
`;

const thumbnailStyle = css`
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
`;

const plainContentStyle = css`
  white-space: pre-wrap;
  line-height: 1.7;
`;
