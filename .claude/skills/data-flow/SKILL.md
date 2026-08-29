---
name: data-flow
description: chaen에서 데이터 읽기/쓰기 흐름(쿼리 키, useQuery/useInfiniteQuery, 뮤테이션 후 캐시 무효화)을 추가·수정할 때의 절차 스킬. "쿼리 추가", "데이터 패칭", "무한스크롤", "useQuery 훅", "뮤테이션", "캐시 무효화" 요청 시 트리거한다. React Query(TanStack Query) v5 + 서버 시드 패턴을 강제한다.
---

# Data-Flow — React Query 읽기/쓰기 흐름

chaen은 **서버 컴포넌트가 첫 페이지를 시드하고, 클라이언트는 React Query로 이어받는** 구조다. 클라이언트 컴포넌트에서 직접 raw `fetch`+`useState`로 로딩 상태를 굴리지 않는다.

> 규칙 기준: `AGENTS.md` §1(FSD), §2(Client/Server 경계). 여기선 **쿼리 키 규칙과 실제 훅 배선**만 다룬다.

## 읽기(Read) 추가

**① 쿼리 키를 `src/shared/lib/query/query-keys.ts`에 추가**

키는 도메인 네임스페이스 객체로, 반드시 `all: ['{domain}'] as const` 프리픽스로 시작한다(무효화가 이 prefix로 걸리므로).

```ts
export const articles = {
  all: ['articles'] as const,
  feed: (params: { locale: AppLocale; q?: string; tag?: string }) =>
    [...articles.all, 'feed', { locale: params.locale, q: normalizeSearchQuery(params.q), tag: normalizeArticleTag(params.tag) }] as const,
};
```

- 키에 넣는 문자열(검색어·태그 등)은 **정규화 함수**를 반드시 통과시킨다 — 정규화가 실제 조회 함수(`get-articles.ts`)와 한 글자라도 다르면 같은 데이터에 다른 키가 생겨 캐시가 쪼개진다. 새 정규화 함수를 만들 땐 조회 함수 쪽 로직과 나란히 두고 동일하게 유지한다.
- **로케일을 키에서 빼먹지 않는다** — locale이 다르면 다른 데이터다. 파라미터에 locale이 있는데 키에 안 넣으면 언어 전환 시 이전 로케일 데이터가 그대로 보인다.

**② 훅 작성 — `src/features/{feature}/model/use-*.ts` 또는 `src/widgets/{widget}/model/use-*.ts`**

무한스크롤은 `useInfiniteQuery`, 단건/목록은 `useQuery`. 서버가 이미 첫 페이지를 렌더했다면 `initialData`로 시드하고 `staleTime: Infinity`로 자동 refetch를 막는다(서버 렌더 결과를 신뢰하고 재요청하지 않는다). 실제 예시 — `src/features/browse-articles/model/use-browse-articles.ts`:

```ts
const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: articles.feed({ locale, q: query, tag: activeTag }),
  queryFn: async ({ pageParam, signal }) => readArticlesFeedPage(url(pageParam), signal),
  getNextPageParam: lastPage => lastPage.nextCursor,
  initialPageParam: initialCursor,
  initialData: { pageParams: [null], pages: [{ items: initialItems, nextCursor: initialCursor }] },
  staleTime: Infinity,
});
```

- `queryFn`엔 반드시 `signal`을 받아 `fetch(url, { signal })`에 전달한다 — 수동 `AbortController`를 새로 만들지 않는다(React Query가 언마운트/키 변경 시 자동 취소).
- 에러는 `error ? getErrorMessage(error) : null` 형태로 훅 반환값에 노출하고, 소비 컴포넌트는 이 필드만 본다.
- 서버 시드가 없는(순수 상호작용성) 쿼리는 `enabled` 조건으로 필요 시점에만 조회한다(예: `use-home-hero-project-preview.ts`의 `enabled: resolvedInitialItems.length === 0`).

**③ 소비 컴포넌트** — 훅의 반환 계약(필드명)만 보고 렌더한다. `isLoading`/`isFetchingNextPage`는 스켈레톤으로, `errorMessage`는 에러 UI로 매핑한다.

## 쓰기(Write) 추가·변경 — 뮤테이션

**핵심 원칙: 낙관적 업데이트를 기본으로 쓰지 않는다.** 서버가 id를 생성하거나, 페이지가 clamp되거나(예: 댓글), 삭제 후 표시 규칙이 있는 도메인은 **성공 후 결정적 재조회**로 캐시를 채운다. 실제 패턴 — `src/widgets/article-comments/ui/article-comments-section.tsx`:

```ts
const result = await someMutationAction({ ...payload, fresh: true });

if (!result.ok) {
  // 재조회 자체가 실패해도 뮤테이션은 이미 서버에 반영됨 — 무효화로 자동 복구
  await queryClient.invalidateQueries({ queryKey: articleComments.scope(articleId) });
  return;
}

queryClient.setQueryData(articleComments.page(articleId, locale, result.data.sort, result.data.page), result.data);
queryClient.invalidateQueries({ queryKey: articleComments.scope(articleId), refetchType: 'none' });
```

- **성공 시**: 재조회한 최신본을 `setQueryData`로 정확한 키에 심고(즉시 UI 반영), 형제 키(같은 도메인의 다른 페이지/정렬)는 `scope(id)` prefix로 `refetchType: 'none'` 무효화해 stale만 표시(다음 접근 시 재조회, 지금 당장 네트워크 요청은 안 함).
- **재조회 자체가 실패해도** 뮤테이션은 이미 서버에 반영됐으므로, `invalidateQueries`(기본 `refetchType`)로 활성 쿼리를 즉시 다시 불러와 UI를 서버 상태와 맞춘다. 이 실패 경로를 빼먹으면 뮤테이션은 성공했는데 화면은 갱신되지 않는 상태가 남는다.
- **prefix 무효화용 `scope()` 키**를 도메인에 추가한다: `scope: (id) => [...domain.all, 'byId', id] as const` 형태로, 개별 `page()`/`detail()` 키가 이 prefix 아래 있도록 설계한다.
- `router.refresh()`로 서버 컴포넌트를 재검증해 클라이언트 쿼리를 갈음하지 않는다 — 캐시는 `invalidateQueries`/`setQueryData`로 직접 다룬다.

## 검증

```bash
pnpm check-types
pnpm lint
pnpm test:node        # query-keys 정규화/키 안정성 테스트가 있다면
pnpm test:dom:model   # 훅 단위 테스트
```

## 자가 확인

- [ ] 새 키가 `{domain}.all` prefix로 시작하는가? 정규화 함수가 조회 함수 쪽과 동일한가?
- [ ] locale 등 데이터를 실제로 가르는 모든 파라미터가 키에 들어가 있는가?
- [ ] `queryFn`이 `signal`을 받아 `fetch`에 전달하는가(수동 AbortController 없음)?
- [ ] 서버 시드가 있는 쿼리는 `initialData`+`staleTime: Infinity`로 불필요한 재조회를 막았는가?
- [ ] 뮤테이션 성공 시 `setQueryData`로 정확한 키를 채우고, 형제는 `scope()` prefix로 무효화했는가?
- [ ] 재조회 실패 시에도 `invalidateQueries`로 복구되는 경로가 있는가(뮤테이션 성공 후 화면이 안 바뀌는 상태가 없는가)?
