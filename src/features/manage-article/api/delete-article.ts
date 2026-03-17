'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { ARTICLES_CACHE_TAG, createArticleCacheTag } from '@/entities/article/model/cache-tags';
import { locales } from '@/i18n/routing';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

const deleteArticleSchema = z.object({
  articleId: z.string().trim().min(1, '대상 글을 확인할 수 없습니다.'),
  articleSlug: z.string().trim().min(1, '대상 글 경로를 확인할 수 없습니다.'),
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
});

const ARTICLE_DELETE_FAILED = 'article.deleteFailed';

/**
 * locale별 공개 아티클 경로를 다시 검증합니다.
 */
const revalidateArticlePublicPaths = (articleSlug: string) => {
  locales.forEach(locale => {
    revalidatePath(
      buildLocalizedPathname({
        locale,
        pathname: '/articles',
      }),
    );
    revalidatePath(
      buildLocalizedPathname({
        locale,
        pathname: `/articles/${articleSlug}`,
      }),
    );
  });
};

/**
 * 관리자만 공개 아티클을 삭제하고 목록으로 이동합니다.
 */
export const deleteArticleAction = async (input: {
  articleId: string;
  articleSlug: string;
  locale: string;
}) => {
  const validation = validateActionInput(deleteArticleSchema, input);

  if (!validation.ok) {
    throw new Error(validation.errorMessage);
  }

  await requireAdmin({ locale: validation.data.locale, onUnauthorized: 'throw' });

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error(ARTICLE_DELETE_FAILED);
  }

  const { articleId, articleSlug, locale } = validation.data;
  const { error: deleteError } = await supabase.rpc('delete_article_cascade', {
    target_article_id: articleId,
  });

  if (deleteError) {
    throw new Error(ARTICLE_DELETE_FAILED);
  }

  revalidateArticlePublicPaths(articleSlug);
  revalidateTag(ARTICLES_CACHE_TAG);
  revalidateTag(createArticleCacheTag(articleId));

  redirect(
    buildLocalizedPathname({
      locale: locale as (typeof locales)[number],
      pathname: '/articles',
    }),
  );
};
