import { z } from 'zod';

import { validateActionInput } from '@/shared/lib/action/validate-action-input';

export const projectFeedPageQuerySchema = z.object({
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
});

/**
 * 프로젝트 무한 스크롤 GET query string을 검증 가능한 shape로 읽습니다.
 */
export const readProjectFeedPageQuery = (searchParams: URLSearchParams) =>
  validateActionInput(projectFeedPageQuerySchema, {
    cursor: searchParams.get('cursor'),
    limit: searchParams.get('limit'),
    locale: searchParams.get('locale'),
  });
