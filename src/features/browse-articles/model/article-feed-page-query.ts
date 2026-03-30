import { z } from 'zod';

import { validateActionInput } from '@/shared/lib/action/validate-action-input';

export const articleFeedPageQuerySchema = z.object({
  cursor: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'limit은 1 이상이어야 합니다.')
    .max(50, 'limit은 50 이하여야 합니다.'),
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
  query: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  tag: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
});

/**
 * 아티클 무한 스크롤 GET query string을 검증 가능한 shape로 읽습니다.
 */
export const readArticleFeedPageQuery = (searchParams: URLSearchParams) =>
  validateActionInput(articleFeedPageQuerySchema, {
    cursor: searchParams.get('cursor'),
    limit: searchParams.get('limit'),
    locale: searchParams.get('locale'),
    query: searchParams.get('q'),
    tag: searchParams.get('tag'),
  });
