import { getTagOptionsByLocale } from '@/entities/tag/api/query-tags';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

/**
 * 관리자 에디터 태그 선택 목록을 반환합니다.
 */
export const GET = async (request: Request) =>
  runJsonRoute({
    action: async () => {
      const locale = new URL(request.url).searchParams.get('locale')?.trim() || 'ko';
      return getTagOptionsByLocale(locale);
    },
    errorMessage: '태그 목록을 불러오지 못했습니다.',
  });
