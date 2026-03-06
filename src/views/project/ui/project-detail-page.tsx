import { getTranslations } from 'next-intl/server';

import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import type { Project, ProjectDetailListItem } from '@/entities/project/model/types';
import { formatMonthYear } from '@/shared/lib/date/format-month-year';
import { ProjectDetailPageClient } from '@/views/project/ui/project-detail-page.client';

type ProjectDetailPageProps = {
  archiveItems: ProjectDetailListItem[];
  item: Project;
  locale: string;
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
export const ProjectDetailPage = async ({ archiveItems, item, locale }: ProjectDetailPageProps) => {
  const t = await getTranslations('ProjectDetail');
  const detailUi = await getTranslations('DetailUi');
  const periodText = formatProjectPeriod(item, locale, t('ongoing'));

  return (
    <ProjectDetailPageClient
      archiveItems={archiveItems}
      content={item.content}
      description={item.description}
      emptyArchiveText={detailUi('emptyArchive')}
      emptyDescriptionText={t('emptyDescription')}
      emptySummaryText={t('emptySummary')}
      id={item.id}
      locale={locale}
      noTagsText={t('noTags')}
      periodText={periodText}
      sectionLabels={{
        description: t('descriptionSection'),
        archive: t('archiveLabel'),
        tagList: t('tagSection'),
      }}
      shareLabels={{
        copyFailed: detailUi('copyFailed'),
        copied: detailUi('shareCopied'),
        share: detailUi('share'),
      }}
      tagLabels={(item.tags ?? []).map(tag => getTagLabelByLocale(tag, locale))}
      title={item.title}
    />
  );
};
