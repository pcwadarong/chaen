import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';

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
    <main style={pageStyle}>
      <article style={articleStyle}>
        <header style={heroStyle}>
          <div style={metaStyle}>
            <span>{t('publishedAt', { date: publishedDate })}</span>
            {updatedDate ? <span>{t('updatedAt', { date: updatedDate })}</span> : null}
          </div>
          <h1 style={titleStyle}>{item.title}</h1>
          <p style={descriptionStyle}>{item.description ?? t('emptySummary')}</p>
          <ul aria-label={t('tagSection')} style={tagListStyle}>
            {tagLabels.length > 0 ? (
              tagLabels.map(tagLabel => (
                <li key={tagLabel} style={tagItemStyle}>
                  #{tagLabel}
                </li>
              ))
            ) : (
              <li style={tagItemStyle}>#{t('noTags')}</li>
            )}
          </ul>
        </header>

        <section aria-labelledby="article-thumbnail-heading" style={panelStyle}>
          <h2 id="article-thumbnail-heading" style={sectionTitleStyle}>
            {t('thumbnailSection')}
          </h2>
          {thumbnailSrc ? (
            <div style={thumbnailWrapStyle}>
              <Image
                alt={t('thumbnailAlt', { title: item.title })}
                height={768}
                src={thumbnailSrc}
                style={thumbnailStyle}
                width={1366}
              />
            </div>
          ) : (
            <p style={emptyTextStyle}>{t('emptyThumbnail')}</p>
          )}
        </section>

        <section aria-labelledby="article-content-heading" style={panelStyle}>
          <h2 id="article-content-heading" style={sectionTitleStyle}>
            {t('contentSection')}
          </h2>
          {item.content ? (
            <p style={plainContentStyle}>{item.content}</p>
          ) : (
            <p style={emptyTextStyle}>{t('emptyContent')}</p>
          )}
        </section>
      </article>
    </main>
  );
};

const pageStyle: CSSProperties = {
  width: 'min(1120px, calc(100% - 2rem))',
  margin: '0 auto',
  padding: '3rem 0 5rem',
};

const articleStyle: CSSProperties = {
  display: 'grid',
  gap: '1.25rem',
};

const heroStyle: CSSProperties = {
  display: 'grid',
  gap: '0.85rem',
  padding: '1.75rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(var(--color-border) / 0.24)',
  background:
    'linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))), rgb(var(--color-surface))',
};

const metaStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.65rem',
  color: 'rgb(var(--color-muted))',
  fontSize: '0.9rem',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2.2rem, 5vw, 4.4rem)',
  lineHeight: 0.98,
  letterSpacing: '-0.04em',
};

const descriptionStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
  maxWidth: '70ch',
};

const tagListStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
};

const tagItemStyle: CSSProperties = {
  padding: '0.25rem 0.7rem',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid rgb(var(--color-border) / 0.28)',
  backgroundColor: 'rgb(var(--color-surface) / 0.82)',
  fontSize: '0.85rem',
};

const panelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.9rem',
  padding: '1.5rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(var(--color-border) / 0.2)',
  backgroundColor: 'rgb(var(--color-surface) / 0.92)',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: '1.2rem',
  lineHeight: 1.2,
  letterSpacing: '-0.02em',
};

const emptyTextStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
};

const thumbnailWrapStyle: CSSProperties = {
  width: '100%',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  border: '1px solid rgb(var(--color-border) / 0.2)',
  backgroundColor: 'rgb(var(--color-surface-strong) / 0.36)',
};

const thumbnailStyle: CSSProperties = {
  width: '100%',
  height: 'auto',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
};

const plainContentStyle: CSSProperties = {
  whiteSpace: 'pre-wrap',
  lineHeight: 1.7,
};
