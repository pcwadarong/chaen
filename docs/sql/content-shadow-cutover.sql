begin;

-- 주의:
-- 이 SQL은 shadow runtime 검증과 코드 cleanup이 끝난 뒤에만 실행합니다.
-- 현재 런타임이 여전히 `*_v2` 이름을 직접 참조하므로,
-- 실행 직후에는 content-shadow-schema 상수도 canonical 이름으로 바꿔서 배포해야 합니다.

alter table public.articles rename to articles_legacy;
alter table public.projects rename to projects_legacy;
alter table public.article_tags rename to article_tags_legacy;
alter table public.project_tags rename to project_tags_legacy;

alter table public.articles_v2 rename to articles;
alter table public.projects_v2 rename to projects;
alter table public.article_tags_v2 rename to article_tags;
alter table public.project_tags_v2 rename to project_tags;

create index if not exists article_tags_tag_id_idx
on public.article_tags(tag_id);

create index if not exists project_tags_tag_id_idx
on public.project_tags(tag_id);

create or replace function public.search_article_translations(
  search_query text,
  target_locale text,
  page_limit integer default 12,
  cursor_rank double precision default null,
  cursor_created_at timestamptz default null,
  cursor_id text default null
)
returns table(
  id text,
  title text,
  description text,
  thumbnail_url text,
  created_at timestamptz,
  search_rank double precision,
  total_count bigint
)
language plpgsql
as $$
begin
  return query
  with search_input as (
    select plainto_tsquery('simple', search_query) as query
  ),
  ranked_articles as (
    select
      translation.article_id as id,
      translation.title,
      translation.description,
      article.thumbnail_url,
      article.created_at,
      ts_rank(translation.fts_vector, (select query from search_input))::double precision as rank
    from public.article_translations translation
    join public.articles article on article.id = translation.article_id
    where
      translation.locale = target_locale
      and (
        translation.fts_vector @@ (select query from search_input)
        or translation.title ilike '%' || search_query || '%'
      )
  )
  select
    ranked_articles.id,
    ranked_articles.title,
    ranked_articles.description,
    ranked_articles.thumbnail_url,
    ranked_articles.created_at,
    ranked_articles.rank as search_rank,
    count(*) over() as total_count
  from ranked_articles
  where
    (cursor_rank is null)
    or (ranked_articles.rank < cursor_rank)
    or (ranked_articles.rank = cursor_rank and ranked_articles.created_at < cursor_created_at)
    or (
      ranked_articles.rank = cursor_rank
      and ranked_articles.created_at = cursor_created_at
      and ranked_articles.id < cursor_id
    )
  order by ranked_articles.rank desc, ranked_articles.created_at desc, ranked_articles.id desc
  limit page_limit + 1;
end;
$$;

drop function if exists public.search_articles(
  text,
  text,
  integer,
  double precision,
  timestamptz,
  uuid
);

drop function if exists public.search_articles(
  text,
  text,
  integer,
  double precision,
  timestamptz,
  text
);

drop function if exists public.get_popular_article_tags(integer, text);

commit;

-- 검증 예시
--
-- select to_regclass('public.articles');
-- select to_regclass('public.projects');
-- select to_regclass('public.article_translations');
-- select to_regclass('public.project_translations');
-- select to_regclass('public.articles_legacy');
-- select to_regclass('public.projects_legacy');
-- select to_regclass('public.article_tags');
-- select to_regclass('public.project_tags');
-- select to_regclass('public.article_tags_legacy');
-- select to_regclass('public.project_tags_legacy');
--
-- select count(*) from public.articles;
-- select count(*) from public.article_translations;
-- select count(*) from public.projects;
-- select count(*) from public.project_translations;
--
-- select *
-- from public.search_article_translations(
--   'react',
--   'ko',
--   12,
--   null,
--   null,
--   null
-- );
--
-- 주의:
-- legacy `text[] tags` 컬럼은 `_legacy` 테이블에만 남습니다.
-- 충분히 안정화된 뒤 별도 cleanup SQL에서 `_legacy` 테이블을 drop합니다.
