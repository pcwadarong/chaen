import { formatYear } from '@/shared/lib/date/format-year';

import type { DetailArchiveLinkItem } from './detail-page-shell';

type DetailArchiveRecord = {
  created_at: string;
  description: string | null;
  id: string;
  title: string;
};

type BuildDetailArchiveLinkItemsInput<TItem extends DetailArchiveRecord> = {
  getHref: (item: TItem) => string;
  items: TItem[];
  locale: string;
  selectedId: string;
};

/**
 * 상세 페이지 좌측 아카이브 목록 데이터를 공용 링크 아이템으로 변환합니다.
 */
export const buildDetailArchiveLinkItems = <TItem extends DetailArchiveRecord>({
  getHref,
  items,
  locale,
  selectedId,
}: BuildDetailArchiveLinkItemsInput<TItem>): DetailArchiveLinkItem[] =>
  items.map(item => ({
    description: item.description,
    href: getHref(item),
    isActive: item.id === selectedId,
    title: item.title,
    yearText: formatYear(item.created_at, locale) ?? '-',
  }));
