import { getLocalizedPopularArticleTags } from '@/entities/article/api/list/get-popular-article-tags';
import type { LocalizedArticleTagStat } from '@/entities/article/model/types';
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

      return getLocalizedPopularArticleTags({ locale });
    },
    errorMessage: API_INTERNAL_ERROR_MESSAGE.tagsFetchFailed,
  });
