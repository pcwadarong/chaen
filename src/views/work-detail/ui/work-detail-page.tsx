import { css } from '@emotion/react';
import { getTranslations } from 'next-intl/server';

import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import type { Project } from '@/entities/project/model/types';
import { formatMonthYear } from '@/shared/lib/date/format-month-year';
import { createImageViewerUrl } from '@/shared/lib/url/create-image-viewer-url';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';
import { WorkDetailMediaGallery } from '@/views/work-detail/ui/work-detail-media-gallery';

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
  const imageViewerText = await getTranslations('ImageViewer');
  const mediaUrls = getProjectMediaUrls(item);
  const mediaItems = mediaUrls.map((mediaUrl, index) => ({
    alt: t('mediaAlt', { index: index + 1, title: item.title }),
    src: createImageViewerUrl(mediaUrl),
    unoptimized: isGifUrl(mediaUrl),
  }));
  const periodText = formatProjectPeriod(item, locale, t('ongoing'));

  return (
    <main css={pageStyle}>
      <article css={articleStyle}>
        <header css={heroStyle}>
          <div css={metaStyle}>
            <span>{periodText}</span>
            <span>{t('publishedAt', { date: item.created_at.slice(0, 10) })}</span>
          </div>
          <h1 css={titleStyle}>{item.title}</h1>
          <p css={descriptionStyle}>{item.description ?? t('emptySummary')}</p>
          <ul aria-label={t('tagSection')} css={tagListStyle}>
            {(item.tags ?? []).length > 0 ? (
              (item.tags ?? []).map(tag => (
                <li key={tag} css={tagItemStyle}>
                  #{getTagLabelByLocale(tag, locale)}
                </li>
              ))
            ) : (
              <li css={tagItemStyle}>#{t('noTags')}</li>
            )}
          </ul>
        </header>

        <section aria-labelledby="project-media-heading" css={panelStyle}>
          <h2 id="project-media-heading" css={sectionTitleStyle}>
            {t('mediaSection')}
          </h2>
          <WorkDetailMediaGallery
            emptyText={t('emptyMedia')}
            items={mediaItems}
            sectionLabel={t('mediaSection')}
            viewerLabels={{
              closeAriaLabel: imageViewerText('closeAriaLabel'),
              nextAriaLabel: imageViewerText('nextAriaLabel'),
              previousAriaLabel: imageViewerText('previousAriaLabel'),
              thumbnailListAriaLabel: imageViewerText('thumbnailListAriaLabel'),
              zoomInAriaLabel: imageViewerText('zoomInAriaLabel'),
              zoomOutAriaLabel: imageViewerText('zoomOutAriaLabel'),
            }}
          />
        </section>

        <section aria-labelledby="project-description-heading" css={panelStyle}>
          <h2 id="project-description-heading" css={sectionTitleStyle}>
            {t('descriptionSection')}
          </h2>
          {item.content ? (
            <p css={plainContentStyle}>{item.content}</p>
          ) : (
            <p css={emptyTextStyle}>{t('emptyDescription')}</p>
          )}
        </section>
      </article>
    </main>
  );
};

const pageStyle = css`
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: var(--space-12) var(--space-0) var(--space-20);
`;

const articleStyle = css`
  display: grid;
  gap: var(--space-5);
`;

const heroStyle = css`
  display: grid;
  gap: var(--space-3);
  padding: var(--space-7);
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.24);
  background:
    linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))),
    rgb(var(--color-surface));
`;

const metaStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

const titleStyle = css`
  font-size: clamp(2.2rem, 5vw, 4.4rem);
  line-height: var(--line-height-98);
  letter-spacing: -0.04em;
`;

const descriptionStyle = css`
  color: rgb(var(--color-muted));
  max-width: 70ch;
`;

const tagListStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const tagItemStyle = css`
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.28);
  background-color: rgb(var(--color-surface) / 0.82);
  font-size: var(--font-size-14);
`;

const panelStyle = css`
  display: grid;
  gap: var(--space-4);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.2);
  background-color: rgb(var(--color-surface) / 0.92);
`;

const sectionTitleStyle = css`
  font-size: var(--font-size-20);
  line-height: var(--line-height-120);
  letter-spacing: -0.02em;
`;

const emptyTextStyle = css`
  color: rgb(var(--color-muted));
`;

const plainContentStyle = css`
  white-space: pre-wrap;
  line-height: var(--line-height-170);
`;
