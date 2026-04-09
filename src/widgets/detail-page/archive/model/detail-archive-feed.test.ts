/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';

import {
  type DetailArchivePage,
  mergeCurrentArchiveItemIntoDetailArchivePage,
  mergeDetailArchiveFeedItems,
} from '@/widgets/detail-page/archive/model/detail-archive-feed';

type TestArchiveItem = {
  created_at: string;
  description: string | null;
  id: string;
  publish_at: string;
  slug: string;
  title: string;
};

const createArchiveItem = (
  overrides: Partial<TestArchiveItem> & Pick<TestArchiveItem, 'id' | 'slug' | 'title'>,
): TestArchiveItem => ({
  created_at: '2026-03-10T00:00:00.000Z',
  description: null,
  publish_at: '2026-03-10T00:00:00.000Z',
  ...overrides,
});

const createArchivePage = (items: TestArchiveItem[]): DetailArchivePage<TestArchiveItem> => ({
  items,
  nextCursor: 'cursor-1',
});

describe('detail-archive-feed model', () => {
  it('초기 페이지에 현재 상세 항목이 없으면 맨 앞에 한 번만 삽입해야 한다', () => {
    const page = createArchivePage([
      createArchiveItem({
        description: '이전 글',
        id: 'article-1',
        slug: 'article-1-slug',
        title: '이전 글',
      }),
    ]);

    const mergedPage = mergeCurrentArchiveItemIntoDetailArchivePage(
      page,
      createArchiveItem({
        description: '현재 글',
        id: 'current-article',
        slug: 'current-article-slug',
        title: '현재 글',
      }),
      true,
    );

    expect(mergedPage?.items.map(item => item.id)).toEqual(['current-article', 'article-1']);
  });

  it('맨 위 고정을 끄면 현재 상세 항목을 기존 slice 뒤에 두어 순서를 유지해야 한다', () => {
    const page = createArchivePage([
      createArchiveItem({
        id: 'article-2',
        publish_at: '2026-03-12T00:00:00.000Z',
        slug: 'article-2-slug',
        title: '최신 글',
      }),
      createArchiveItem({
        id: 'article-1',
        publish_at: '2026-03-11T00:00:00.000Z',
        slug: 'article-1-slug',
        title: '그다음 글',
      }),
    ]);

    const mergedPage = mergeCurrentArchiveItemIntoDetailArchivePage(
      page,
      createArchiveItem({
        id: 'current-article',
        slug: 'current-article-slug',
        title: '현재 글',
      }),
      false,
    );

    expect(mergedPage?.items.map(item => item.id)).toEqual([
      'article-2',
      'article-1',
      'current-article',
    ]);
  });

  it('cursor 다음 페이지에 같은 id가 있어도 기존 항목을 유지한 채 한 번만 합쳐야 한다', () => {
    const mergedItems = mergeDetailArchiveFeedItems(
      [
        createArchiveItem({
          id: 'article-1',
          slug: 'article-1-slug',
          title: '첫 글',
        }),
      ],
      [
        createArchiveItem({
          description: '중복이지만 무시',
          id: 'article-1',
          slug: 'article-1-slug',
          title: '첫 글',
        }),
        createArchiveItem({
          id: 'article-2',
          slug: 'article-2-slug',
          title: '둘째 글',
        }),
      ],
    );

    expect(mergedItems.map(item => item.id)).toEqual(['article-1', 'article-2']);
    expect(mergedItems[0]?.description).toBeNull();
  });
});
