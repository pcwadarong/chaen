/**
 * 상세 아카이브 피드가 공통으로 다루는 최소 레코드 형태입니다.
 */
export type DetailArchiveRecord = {
  description: string | null;
  id: string;
  publish_at?: string | null;
  slug?: string | null;
  title: string;
};

/**
 * 상세 아카이브 피드의 cursor 페이지 형태입니다.
 */
export type DetailArchivePage<TItem extends DetailArchiveRecord> = {
  items: TItem[];
  nextCursor: string | null;
};

/**
 * 현재 상세 항목을 초기 페이지에 합치되, 이미 같은 id가 있으면 한 번만 유지합니다.
 * `pinCurrentItemToTop`이 꺼져 있으면 기존 slice 순서를 최대한 유지하도록 뒤에 붙인 뒤 중복을 제거합니다.
 */
export const mergeCurrentArchiveItemIntoDetailArchivePage = <TItem extends DetailArchiveRecord>(
  page: DetailArchivePage<TItem> | null,
  currentItem: TItem | null,
  pinCurrentItemToTop: boolean,
): DetailArchivePage<TItem> | null => {
  if (!page || !currentItem) return page;

  const itemsWithCurrent = pinCurrentItemToTop
    ? [currentItem, ...page.items]
    : [...page.items, currentItem];

  return {
    ...page,
    items: dedupeDetailArchiveItems(itemsWithCurrent),
  };
};

/**
 * cursor 기반으로 이어 붙인 상세 아카이브 항목에서 id 중복을 제거합니다.
 * 먼저 등장한 항목을 유지해 기존 viewport 순서가 흔들리지 않도록 합니다.
 */
export const mergeDetailArchiveFeedItems = <TItem extends { id: string }>(
  previousItems: TItem[],
  incomingItems: TItem[],
): TItem[] => dedupeDetailArchiveItems([...previousItems, ...incomingItems]);

/**
 * 상세 아카이브 항목 배열에서 id 기준 첫 항목만 유지합니다.
 */
const dedupeDetailArchiveItems = <TItem extends { id: string }>(items: TItem[]): TItem[] => {
  const seenIds = new Set<string>();

  return items.filter(item => {
    if (seenIds.has(item.id)) {
      return false;
    }

    seenIds.add(item.id);

    return true;
  });
};
