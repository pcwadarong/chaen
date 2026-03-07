begin;

-- 주의:
-- 이 SQL은 content cutover 이후 rollback이 정말 필요할 때만 실행합니다.
-- canonical 테이블과 _legacy 테이블이 모두 남아 있는 상태를 전제로 합니다.
-- `_legacy` cleanup SQL을 이미 실행했다면 이 rollback은 사용할 수 없습니다.
--
-- 권장 사전 확인:
-- select to_regclass('public.articles');
-- select to_regclass('public.projects');
-- select to_regclass('public.article_tags');
-- select to_regclass('public.project_tags');
-- select to_regclass('public.articles_legacy');
-- select to_regclass('public.projects_legacy');
-- select to_regclass('public.article_tags_legacy');
-- select to_regclass('public.project_tags_legacy');

alter table public.articles rename to articles_v2;
alter table public.projects rename to projects_v2;
alter table public.article_tags rename to article_tags_v2;
alter table public.project_tags rename to project_tags_v2;

alter table public.articles_legacy rename to articles;
alter table public.projects_legacy rename to projects;
alter table public.article_tags_legacy rename to article_tags;
alter table public.project_tags_legacy rename to project_tags;

create index if not exists article_tags_tag_id_idx
on public.article_tags_v2(tag_id);

create index if not exists project_tags_tag_id_idx
on public.project_tags_v2(tag_id);

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
    join public.articles_v2 article on article.id = translation.article_id
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

commit;

-- 실행 후 확인 예시
--
-- select to_regclass('public.articles');
-- select to_regclass('public.projects');
-- select to_regclass('public.article_tags');
-- select to_regclass('public.project_tags');
-- select to_regclass('public.articles_v2');
-- select to_regclass('public.projects_v2');
-- select to_regclass('public.article_tags_v2');
-- select to_regclass('public.project_tags_v2');
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
