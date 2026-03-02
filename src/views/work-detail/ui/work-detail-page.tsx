import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';

import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import type { Project } from '@/entities/project/model/types';
import { formatMonthYear } from '@/shared/lib/date/format-month-year';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';

type WorkDetailPageProps = {
  item: Project;
  locale: string;
};

/**
 * GIF URL인지 여부를 판단합니다.
 */
const isGifUrl = (url: string) => /\.gif($|\?)/i.test(url);

/**
 * 프로젝트 미디어 URL 목록을 중복 없이 병합합니다.
 */
const getProjectMediaUrls = (item: Project) => {
  const uniqueMedia = new Set<string>();

  [item.thumbnail_url, ...(item.gallery_urls ?? [])].forEach(mediaUrl => {
    const normalizedMediaUrl = normalizeImageUrl(mediaUrl);

    if (normalizedMediaUrl) {
      uniqueMedia.add(normalizedMediaUrl);
    }
  });

  return [...uniqueMedia];
};

/**
 * 기간 텍스트를 생성합니다.
 */
const formatProjectPeriod = (item: Project, locale: string, ongoingLabel: string) => {
  const startText = formatMonthYear(item.period_start ?? item.created_at, locale);
  const endText = formatMonthYear(item.period_end, locale);

  if (startText && endText) {
    return `${startText} - ${endText}`;
  }

  if (startText && !endText && item.period_start) {
    return `${startText} - ${ongoingLabel}`;
  }

  if (startText) {
    return startText;
  }

  return ongoingLabel;
};

/**
 * 프로젝트 상세 페이지 컨테이너입니다.
 */
export const WorkDetailPage = async ({ item, locale }: WorkDetailPageProps) => {
  const t = await getTranslations('WorkDetail');
  const mediaUrls = getProjectMediaUrls(item);
  const periodText = formatProjectPeriod(item, locale, t('ongoing'));

  return (
    <main style={pageStyle}>
      <article style={articleStyle}>
        <header style={heroStyle}>
          <div style={metaStyle}>
            <span>{periodText}</span>
            <span>{t('publishedAt', { date: item.created_at.slice(0, 10) })}</span>
          </div>
          <h1 style={titleStyle}>{item.title}</h1>
          <p style={descriptionStyle}>{item.description ?? t('emptySummary')}</p>
          <ul aria-label={t('tagSection')} style={tagListStyle}>
            {(item.tags ?? []).length > 0 ? (
              (item.tags ?? []).map(tag => (
                <li key={tag} style={tagItemStyle}>
                  #{getTagLabelByLocale(tag, locale)}
                </li>
              ))
            ) : (
              <li style={tagItemStyle}>#{t('noTags')}</li>
            )}
          </ul>
        </header>

        <section aria-labelledby="project-media-heading" style={panelStyle}>
          <h2 id="project-media-heading" style={sectionTitleStyle}>
            {t('mediaSection')}
          </h2>
          {mediaUrls.length > 0 ? (
            <div aria-label={t('mediaSection')} role="region" style={mediaSliderStyle}>
              {mediaUrls.map((mediaUrl, index) => (
                <figure key={`${item.id}-${mediaUrl}-${index}`} style={mediaItemStyle}>
                  <Image
                    alt={t('mediaAlt', { index: index + 1, title: item.title })}
                    height={1080}
                    src={mediaUrl}
                    style={mediaImageStyle}
                    unoptimized={isGifUrl(mediaUrl)}
                    width={1920}
                  />
                </figure>
              ))}
            </div>
          ) : (
            <p style={emptyTextStyle}>{t('emptyMedia')}</p>
          )}
        </section>

        <section aria-labelledby="project-description-heading" style={panelStyle}>
          <h2 id="project-description-heading" style={sectionTitleStyle}>
            {t('descriptionSection')}
          </h2>
          {item.content ? (
            <p style={plainContentStyle}>{item.content}</p>
          ) : (
            <p style={emptyTextStyle}>{t('emptyDescription')}</p>
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

const mediaSliderStyle: CSSProperties = {
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: 'min(100%, 100%)',
  gap: '0.75rem',
  overflowX: 'auto',
  paddingBottom: '0.3rem',
  scrollSnapType: 'x mandatory',
};

const mediaItemStyle: CSSProperties = {
  margin: 0,
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  border: '1px solid rgb(var(--color-border) / 0.2)',
  backgroundColor: 'rgb(var(--color-surface-strong) / 0.36)',
  scrollSnapAlign: 'start',
};

const mediaImageStyle: CSSProperties = {
  width: '100%',
  height: 'auto',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
};

const emptyTextStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
};

const plainContentStyle: CSSProperties = {
  whiteSpace: 'pre-wrap',
  lineHeight: 1.7,
};
