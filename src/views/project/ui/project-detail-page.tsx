import { getTranslations } from 'next-intl/server';

import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import type { Project, ProjectDetailListItem } from '@/entities/project/model/types';
import { formatProjectPeriod } from '@/shared/lib/date/format-project-period';
import { ProjectDetailPageClient } from '@/views/project/ui/project-detail-page.client';

type ProjectDetailPageProps = {
  archiveItems: ProjectDetailListItem[];
  item: Project;
  locale: string;
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
      guestbookCtaText={detailUi('leaveGuestbookMessage')}
      id={item.id}
      locale={locale}
      noTagsText={t('noTags')}
      periodText={periodText}
      sectionLabels={{
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
