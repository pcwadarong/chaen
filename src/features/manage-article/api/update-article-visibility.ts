'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

import { ARTICLES_CACHE_TAG, createArticleCacheTag } from '@/entities/article/model/cache-tags';
import { locales } from '@/i18n/routing';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

const articleSlugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]+$/)
  .optional();
const localeSchema = z.enum(locales, {
  error: () => ({ message: '지원되지 않는 로케일입니다.' }),
});

const updateArticleVisibilitySchema = z.object({
  articleId: z.string().trim().min(1, '대상 글을 확인할 수 없습니다.'),
  articleSlug: articleSlugSchema,
  locale: localeSchema,
  visibility: z.enum(['private', 'public']),
});

const ARTICLE_VISIBILITY_UPDATE_FAILED = 'article.visibilityUpdateFailed';

/**
 * 아티클 공개 상태 변경 이후 관리자/공개 경로를 다시 검증합니다.
 */
const revalidateArticleVisibilityPaths = ({
  articleSlug,
  locale,
}: {
  articleSlug?: string;
  locale: string;
}) => {
  revalidatePath(
    buildLocalizedPathname({
      locale: locale as (typeof locales)[number],
      pathname: '/admin/content',
    }),
  );

  locales.forEach(itemLocale => {
    revalidatePath(
      buildLocalizedPathname({
        locale: itemLocale,
        pathname: '/articles',
      }),
    );
    revalidatePath(
      buildLocalizedPathname({
        locale: itemLocale,
        pathname: '/',
      }),
    );

    if (articleSlug) {
      revalidatePath(
        buildLocalizedPathname({
          locale: itemLocale,
          pathname: `/articles/${articleSlug}`,
        }),
      );
    }
  });
};

/**
 * 관리자가 아티클 공개 상태를 즉시 전환합니다.
 */
export const updateArticleVisibilityAction = async (input: {
  articleId: string;
  articleSlug?: string;
  locale: string;
  visibility: 'private' | 'public';
}) => {
  const validation = validateActionInput(updateArticleVisibilitySchema, input);

  if (!validation.ok) {
    throw new Error(validation.errorMessage);
  }

  const { articleId, articleSlug, locale, visibility } = validation.data;

  await requireAdmin({ locale, onUnauthorized: 'throw' });

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error(ARTICLE_VISIBILITY_UPDATE_FAILED);
  }

  const { error } = await supabase.from('articles').update({ visibility }).eq('id', articleId);

  if (error) {
    throw new Error(ARTICLE_VISIBILITY_UPDATE_FAILED);
  }

  revalidateTag(ARTICLES_CACHE_TAG);
  revalidateTag(createArticleCacheTag(articleId));
  revalidateArticleVisibilityPaths({ articleSlug, locale });
};
