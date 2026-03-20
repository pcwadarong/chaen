import { getPopularArticleTags } from '@/entities/article/api/list/get-popular-article-tags';
import type { LocalizedArticleTagStat } from '@/entities/article/model/types';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import { API_INTERNAL_ERROR_MESSAGE } from '@/shared/lib/http/api-error-catalog';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

/**
 * 아티클 목록 우측 패널에서 사용하는 인기 태그 목록을 반환합니다.
 * 첫 문서 렌더와 분리해 hydration 이후에만 태그 집계를 읽습니다.
 */
export const GET = async (request: Request) =>
  runJsonRoute<LocalizedArticleTagStat[]>({
    action: async () => {
      const locale = new URL(request.url).searchParams.get('locale')?.trim() || 'ko';
      const popularTags = await getPopularArticleTags({ locale });
      const localizedTagLabels = await getTagLabelMapBySlugs({
        locale,
        slugs: popularTags.map(item => item.tag),
      });

      if (localizedTagLabels.schemaMissing) {
        throw new Error('[articles] 태그 label schema가 없습니다.');
      }

      return popularTags.map(item => ({
        ...item,
        label: localizedTagLabels.data.get(item.tag) ?? item.tag,
      }));
    },
    errorMessage: API_INTERNAL_ERROR_MESSAGE.tagsFetchFailed,
  });
