import type { MetadataRoute } from 'next';

import { getPublicArticleTagSlugs } from '@/entities/tag';
import { defaultLocale, locales } from '@/i18n/routing';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

type ArticleSitemapRow = {
  article_id: string;
  locale: string;
  articles:
    | {
        publish_at: string | null;
        slug: string | null;
        updated_at: string | null;
      }
    | {
        publish_at: string | null;
        slug: string | null;
        updated_at: string | null;
      }[]
    | null;
};

type ProjectSitemapRow = {
  locale: string;
  project_id: string;
  projects:
    | {
        publish_at: string | null;
        slug: string | null;
        updated_at: string | null;
      }
    | {
        publish_at: string | null;
        slug: string | null;
        updated_at: string | null;
      }[]
    | null;
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
 * Next.js Dynamic Sitemap API용 locale별 홈 URL 엔트리를 생성합니다.
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
 * locale별 이력서 및 프로젝트 목록 URL 엔트리를 생성합니다.
 */
const buildArchiveEntries = (): MetadataRoute.Sitemap =>
  [defaultLocale].flatMap(locale => [
    {
      changeFrequency: 'monthly' as const,
      lastModified: new Date(),
      priority: 0.8,
      url: buildAbsoluteSiteUrl(
        buildLocalizedPathname({
          locale,
          pathname: '/resume',
        }),
      ),
    },
    {
      changeFrequency: 'weekly' as const,
      lastModified: new Date(),
      priority: 0.8,
      url: buildAbsoluteSiteUrl(
        buildLocalizedPathname({
          locale,
          pathname: '/project',
        }),
      ),
    },
  ]);

/**
 * Supabase `article_translations`를 읽어 locale별 아티클 상세 URL을 동적으로 생성합니다.
 */
const fetchArticleEntries = async (): Promise<MetadataRoute.Sitemap> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];
  const nowIsoString = new Date().toISOString();

  const { data, error } = await supabase
    .from('article_translations')
    .select('article_id,locale,articles!inner(updated_at,publish_at,slug)')
    .in('locale', [...locales])
    .eq('articles.visibility', 'public')
    .lte('articles.publish_at', nowIsoString)
    .not('articles.publish_at', 'is', null)
    .not('articles.slug', 'is', null);

  if (error) return [];

  return ((data ?? []) as ArticleSitemapRow[]).flatMap(row => {
    const article = getEmbeddedSitemapRelation(row.articles);
    const articleSlug = article?.slug?.trim();
    if (!articleSlug) return [];

    return [
      {
        changeFrequency: 'weekly' as const,
        lastModified: article?.updated_at
          ? new Date(article.updated_at)
          : article?.publish_at
            ? new Date(article.publish_at)
            : undefined,
        priority: 0.8,
        url: buildAbsoluteSiteUrl(`/${row.locale}/articles/${articleSlug}`),
      },
    ];
  });
};

/**
 * Supabase `project_translations`를 읽어 locale별 프로젝트 상세 URL을 동적으로 생성합니다.
 */
const fetchProjectEntries = async (): Promise<MetadataRoute.Sitemap> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];
  const nowIsoString = new Date().toISOString();

  const { data, error } = await supabase
    .from('project_translations')
    .select('project_id,locale,projects!inner(updated_at,publish_at,slug)')
    .in('locale', [...locales])
    .eq('projects.visibility', 'public')
    .lte('projects.publish_at', nowIsoString)
    .not('projects.publish_at', 'is', null)
    .not('projects.slug', 'is', null);

  if (error) return [];

  return ((data ?? []) as ProjectSitemapRow[]).flatMap(row => {
    const project = getEmbeddedSitemapRelation(row.projects);
    const projectSlug = project?.slug?.trim();
    if (!projectSlug) return [];

    return [
      {
        changeFrequency: 'monthly' as const,
        lastModified: project?.updated_at
          ? new Date(project.updated_at)
          : project?.publish_at
            ? new Date(project.publish_at)
            : undefined,
        priority: 0.8,
        url: buildAbsoluteSiteUrl(`/${row.locale}/project/${projectSlug}`),
      },
    ];
  });
};

/**
 * 공개 아티클 태그 아카이브 URL을 locale별로 생성합니다.
 */
const fetchArticleTagEntries = async (): Promise<MetadataRoute.Sitemap> => {
  const publicArticleTags = await getPublicArticleTagSlugs().catch(() => null);
  if (!publicArticleTags) return [];
  if (publicArticleTags.schemaMissing) return [];

  return publicArticleTags.data.flatMap(tagSlug =>
    locales.map(locale => ({
      alternates: {
        languages: Object.fromEntries(
          locales.map(candidateLocale => [
            candidateLocale,
            buildAbsoluteSiteUrl(
              buildLocalizedPathname({
                locale: candidateLocale,
                pathname: `/articles/tag/${tagSlug}`,
              }),
            ),
          ]),
        ),
      },
      changeFrequency: 'weekly' as const,
      lastModified: new Date(),
      priority: 0.7,
      url: buildAbsoluteSiteUrl(
        buildLocalizedPathname({
          locale,
          pathname: `/articles/tag/${tagSlug}`,
        }),
      ),
    })),
  );
};

/**
 * 수동 XML 파일 대신 Next.js Dynamic Sitemap API 응답을 생성합니다.
 */
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const [archiveEntries, articles, articleTags, homeEntries, projects] = await Promise.all([
    Promise.resolve(buildArchiveEntries()),
    fetchArticleEntries(),
    fetchArticleTagEntries(),
    Promise.resolve(buildHomeEntries()),
    fetchProjectEntries(),
  ]);

  return [...homeEntries, ...archiveEntries, ...articleTags, ...articles, ...projects];
};

export default sitemap;
