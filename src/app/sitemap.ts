import type { MetadataRoute } from 'next';

import { locales } from '@/i18n/routing';
import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

type ArticleSitemapRow = {
  article_id: string;
  locale: string;
  articles:
    | {
        updated_at: string | null;
      }
    | {
        updated_at: string | null;
      }[]
    | null;
};

type ProjectSitemapRow = {
  locale: string;
  project_id: string;
  projects:
    | {
        created_at: string;
      }
    | {
        created_at: string;
      }[]
    | null;
};

type TagSitemapRow = {
  slug: string;
};

/**
 * PostgREST embed 응답을 단일 row로 정규화합니다.
 */
const getEmbeddedSitemapRelation = <TRow extends object>(
  relation: TRow | TRow[] | null,
): TRow | null => {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
};

/**
 * locale별 홈 URL 엔트리를 생성합니다.
 */
const buildHomeEntries = (): MetadataRoute.Sitemap =>
  locales.map(locale => ({
    alternates: {
      languages: Object.fromEntries(
        locales.map(candidateLocale => [
          candidateLocale,
          buildAbsoluteSiteUrl(`/${candidateLocale}`),
        ]),
      ),
    },
    changeFrequency: 'weekly',
    lastModified: new Date(),
    priority: 1,
    url: buildAbsoluteSiteUrl(`/${locale}`),
  }));

/**
 * article translation 테이블 기준 locale별 상세 URL을 생성합니다.
 */
const fetchArticleEntries = async (): Promise<MetadataRoute.Sitemap> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('article_translations')
    .select('article_id,locale,articles!inner(updated_at)')
    .in('locale', [...locales]);

  if (error) return [];

  return ((data ?? []) as ArticleSitemapRow[]).map(row => {
    const article = getEmbeddedSitemapRelation(row.articles);

    return {
      changeFrequency: 'weekly',
      lastModified: article?.updated_at ? new Date(article.updated_at) : new Date(),
      priority: 0.8,
      url: buildAbsoluteSiteUrl(`/${row.locale}/articles/${row.article_id}`),
    };
  });
};

/**
 * project translation 테이블 기준 locale별 상세 URL을 생성합니다.
 */
const fetchProjectEntries = async (): Promise<MetadataRoute.Sitemap> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('project_translations')
    .select('project_id,locale,projects!inner(created_at)')
    .in('locale', [...locales]);

  if (error) return [];

  return ((data ?? []) as ProjectSitemapRow[]).map(row => {
    const project = getEmbeddedSitemapRelation(row.projects);

    return {
      changeFrequency: 'monthly',
      lastModified: new Date(project?.created_at ?? new Date().toISOString()),
      priority: 0.8,
      url: buildAbsoluteSiteUrl(`/${row.locale}/project/${row.project_id}`),
    };
  });
};

/**
 * tag slug 기준 locale별 토픽 클러스터 URL을 생성합니다.
 */
const fetchTagEntries = async (): Promise<MetadataRoute.Sitemap> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from('tags').select('slug');
  if (error) return [];

  return ((data ?? []) as TagSitemapRow[]).flatMap(row =>
    locales.map(locale => ({
      changeFrequency: 'weekly' as const,
      lastModified: new Date(),
      priority: 0.7,
      url: buildAbsoluteSiteUrl(`/${locale}/tag/${row.slug}`),
    })),
  );
};

/**
 * locale별 정적/동적 컨텐츠 URL을 sitemap으로 노출합니다.
 */
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const [articles, homeEntries, projects, tags] = await Promise.all([
    fetchArticleEntries(),
    Promise.resolve(buildHomeEntries()),
    fetchProjectEntries(),
    fetchTagEntries(),
  ]);

  return [...homeEntries, ...articles, ...projects, ...tags];
};

export default sitemap;
