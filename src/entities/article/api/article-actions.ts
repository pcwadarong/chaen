'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { ARTICLES_CACHE_TAG, createArticleCacheTag } from '@/entities/article/model/cache-tags';
import type { ArticleArchivePage, ArticleListPage } from '@/entities/article/model/types';
import { locales } from '@/i18n/routing';
import {
  type ActionResult,
  createActionFailure,
  createActionSuccess,
} from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import { getArticleDetailList } from './get-article-detail-list';
import { getArticles } from './get-articles';
import { incrementArticleViewCount } from './increment-article-view-count';

const articleFeedPageSchema = z.object({
  cursor: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  limit: z.number().int().min(1).max(50),
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

const articleArchivePageSchema = z.object({
  cursor: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  limit: z.number().int().min(1).max(50),
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
});

const incrementArticleViewCountSchema = z.object({
  articleId: z.string().trim().min(1, '대상 글을 확인할 수 없습니다.'),
});

const deleteArticleSchema = z.object({
  articleId: z.string().trim().min(1, '대상 글을 확인할 수 없습니다.'),
  articleSlug: z.string().trim().min(1, '대상 글 경로를 확인할 수 없습니다.'),
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
});

type ArticleViewCountActionData = {
  viewCount: number;
};

const ARTICLE_ACTION_ERROR_MESSAGE = {
  archiveFetchFailed: 'article.archiveFetchFailed',
  deleteFailed: 'article.deleteFailed',
  listFetchFailed: 'article.listFetchFailed',
  viewCountUpdateFailed: 'article.viewCountUpdateFailed',
} as const;

/**
 * 아티클 목록 무한 스크롤용 페이지를 반환합니다.
 */
export const getArticlesPageAction = async (input: {
  cursor?: string | null;
  limit: number;
  locale: string;
  query?: string | null;
  tag?: string | null;
}): Promise<ActionResult<ArticleListPage>> => {
  const validation = validateActionInput(articleFeedPageSchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const page = await getArticles({
      cursor: validation.data.cursor,
      limit: validation.data.limit,
      locale: validation.data.locale,
      query: validation.data.query,
      tag: validation.data.tag,
    });

    return createActionSuccess(page);
  } catch (_error) {
    return createActionFailure(
      ARTICLE_ACTION_ERROR_MESSAGE.listFetchFailed,
      ARTICLE_ACTION_ERROR_MESSAGE.listFetchFailed,
    );
  }
};

/**
 * 아티클 상세 좌측 아카이브 추가 로드 페이지를 반환합니다.
 */
export const getArticleDetailArchivePageAction = async (input: {
  cursor?: string | null;
  limit: number;
  locale: string;
}): Promise<ActionResult<ArticleArchivePage>> => {
  const validation = validateActionInput(articleArchivePageSchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const page = await getArticleDetailList({
      cursor: validation.data.cursor,
      limit: validation.data.limit,
      locale: validation.data.locale,
    });

    return createActionSuccess(page);
  } catch (_error) {
    return createActionFailure(
      ARTICLE_ACTION_ERROR_MESSAGE.archiveFetchFailed,
      ARTICLE_ACTION_ERROR_MESSAGE.archiveFetchFailed,
    );
  }
};

/**
 * 아티클 조회수를 증가시키고 최신 값을 반환합니다.
 */
export const incrementArticleViewCountAction = async (input: {
  articleId: string;
}): Promise<ActionResult<ArticleViewCountActionData>> => {
  const validation = validateActionInput(incrementArticleViewCountSchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  await getServerAuthState();

  try {
    const viewCount = await incrementArticleViewCount(validation.data.articleId);

    return createActionSuccess({ viewCount });
  } catch (_error) {
    return createActionFailure(
      ARTICLE_ACTION_ERROR_MESSAGE.viewCountUpdateFailed,
      ARTICLE_ACTION_ERROR_MESSAGE.viewCountUpdateFailed,
    );
  }
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
    throw new Error(ARTICLE_ACTION_ERROR_MESSAGE.deleteFailed);
  }

  const { articleId, articleSlug, locale } = validation.data;

  const { error: commentsError } = await supabase
    .from('article_comments')
    .delete()
    .eq('article_id', articleId);
  if (commentsError) throw new Error(ARTICLE_ACTION_ERROR_MESSAGE.deleteFailed);

  const { error: tagsError } = await supabase
    .from('article_tags')
    .delete()
    .eq('article_id', articleId);
  if (tagsError) throw new Error(ARTICLE_ACTION_ERROR_MESSAGE.deleteFailed);

  const { error: translationsError } = await supabase
    .from('article_translations')
    .delete()
    .eq('article_id', articleId);
  if (translationsError) throw new Error(ARTICLE_ACTION_ERROR_MESSAGE.deleteFailed);

  const { error: draftsError } = await supabase
    .from('drafts')
    .delete()
    .eq('content_type', 'article')
    .eq('content_id', articleId);
  if (draftsError) throw new Error(ARTICLE_ACTION_ERROR_MESSAGE.deleteFailed);

  const { error: articleError } = await supabase.from('articles').delete().eq('id', articleId);
  if (articleError) throw new Error(ARTICLE_ACTION_ERROR_MESSAGE.deleteFailed);

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
