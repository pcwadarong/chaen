import { resolvePublicContentPublishedAt } from '@/shared/lib/content/public-content';
import {
  parseLocaleAwarePublishedAtIdCursor,
  serializeLocaleAwarePublishedAtIdCursor,
} from '@/shared/lib/pagination/keyset-pagination';

type ArchivePage<TItem> = {
  items: TItem[];
  nextCursor: string | null;
};

type ArchiveSummaryItem = {
  description: string | null;
  id: string;
  publish_at?: string | null;
  slug?: string | null;
  title: string;
};

/**
 * 현재 상세 대상을 첫 페이지 아카이브 목록 앞에 보정하고,
 * 이어지는 cursor도 실제 마지막 렌더링 아이템 기준으로 다시 맞춥니다.
 */
export const prependCurrentArchiveItem = <
  TItem extends ArchiveSummaryItem,
  TCurrentItem extends ArchiveSummaryItem,
>(
  currentItem: TCurrentItem | null,
  archivePage: ArchivePage<TItem>,
): ArchivePage<TItem> => {
  if (!currentItem) return archivePage;
  if (archivePage.items.some(archiveItem => archiveItem.id === currentItem.id)) return archivePage;

  const remainingItemCount = Math.max(archivePage.items.length - 1, 0);
  const nextItems = [
    {
      description: currentItem.description,
      id: currentItem.id,
      publish_at: currentItem.publish_at,
      slug: currentItem.slug,
      title: currentItem.title,
    } as TItem,
    ...archivePage.items.slice(0, remainingItemCount),
  ];

  if (!archivePage.nextCursor) {
    return {
      ...archivePage,
      items: nextItems,
    };
  }

  const parsedCursor = parseLocaleAwarePublishedAtIdCursor(archivePage.nextCursor);
  const lastItem = nextItems.at(-1);

  return {
    ...archivePage,
    items: nextItems,
    nextCursor:
      parsedCursor && lastItem
        ? serializeLocaleAwarePublishedAtIdCursor({
            id: lastItem.id,
            locale: parsedCursor.locale,
            publishedAt: resolvePublicContentPublishedAt(lastItem),
          })
        : null,
  };
};
