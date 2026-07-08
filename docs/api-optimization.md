# API 호출 최적화 — 무엇이 문제였고, 어떤 원리로 고쳤나

> React Query(TanStack Query) 도입 + Next.js 캐시 계층 정비 + DB 왕복 최소화.
> 파일 경로가 아니라 **원리** 중심으로 정리한 학습 노트.

---

## 1. 진단: 문제는 세 층위에 있었다

브라우저에서 화면이 뜨기까지의 여정을 따라가면, 느림은 항상 세 구간 중 하나에서 생긴다.

```
[브라우저] ──① 클라이언트 fetch──▶ [Next.js 서버] ──② 서버 캐시──▶ [DB(Supabase)]
                                                        └─③ 쿼리 왕복 횟수─┘
```

### ① 클라이언트: "손으로 만든 절반짜리 React Query"

기존 코드는 모든 클라이언트 fetch가 이 패턴이었다:

```tsx
const [items, setItems] = useState([]);
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  const controller = new AbortController();
  setIsLoading(true);
  fetch('/api/...', { signal: controller.signal })
    .then(res => res.json())
    .then(data => setItems(data))
    .finally(() => setIsLoading(false));
  return () => controller.abort();
}, [deps]);
```

이 패턴의 숨은 비용:

- **캐시가 없다.** 뒤로가기로 돌아오면 같은 데이터를 또 받아온다. 사용자는 이미 봤던 목록 앞에서 스피너를 다시 본다.
- **중복 요청 제거(dedupe)가 없다.** 두 컴포넌트가 같은 데이터를 원하면 요청이 두 번 나간다.
- **상태 기계가 수제작이다.** loading / error / success / 취소 / 언마운트-후-setState 방지 — 전부 매번 다시 만든다. 실제로 댓글 위젯은 이걸 견디다 못해 **자체 in-memory Map 캐시(60초 TTL)**까지 직접 구현하고 있었다. 라이브러리가 하는 일을 반쯤 재발명한 것.

### ② 서버 캐시: 태그 무효화만 있고 시간 만료가 없었다

Next.js의 `'use cache'` 캐시는 `revalidateTag()`가 불릴 때만 갱신되는 구조였다. 그런데 글 목록 쿼리는 `publish_at <= now()` 조건을 포함한다. 즉 **"미래에 발행 예약된 글"은 아무도 태그를 무효화해주지 않으면 영원히 안 나타난다.** 시간이 지나면 결과가 달라지는 쿼리를 시간 만료 없이 캐싱한 것 — 실질적 버그였다.

### ③ DB 왕복: N+1과 불필요한 순차 실행

- 게스트북/댓글: 부모 글 N개를 가져온 뒤 **부모마다 답글 쿼리를 1번씩**(1+N번 왕복).
- 아카이브 사이드바: 서로 독립적인 두 쿼리를 `await`로 **순차** 실행.
- 서버↔DB 사이 한 번의 왕복이 수십 ms라면, 왕복 횟수가 곧 응답 시간이다. 병렬화하면 `max(a, b)`, 순차면 `a + b`.

---

## 2. React Query의 핵심 모델 — 왜 이걸로 다 해결되나

React Query의 본질은 한 문장이다: **"서버 데이터는 로컬 상태가 아니라 캐시다."**

### queryKey = 캐시의 주소

```ts
useQuery({ queryKey: ['projects', 'preview', locale, 3], queryFn: ... })
```

키가 같으면 캐시를 공유하고, 키가 바뀌면 다른 데이터로 취급한다. `useState` + `useEffect` 조합에서 "deps가 바뀌면 다시 fetch"라고 손으로 쓰던 로직이, **키 설계**로 선언적으로 바뀐다. 그래서 키를 한 곳(팩토리)에서 관리하는 게 중요하다 — 키가 곧 캐시 무효화의 단위이기 때문에, `['pdf', 'options']`처럼 **접두사만으로 하위 캐시를 전부 무효화**할 수 있다.

### staleTime vs gcTime — 두 개의 시계

|             | 의미                             | 지나면                                                              |
| ----------- | -------------------------------- | ------------------------------------------------------------------- |
| `staleTime` | "이 데이터는 얼마나 신선한가"    | stale로 표시. **화면엔 즉시 캐시를 보여주고**, 뒤에서 조용히 재검증 |
| `gcTime`    | "안 쓰는 캐시를 얼마나 보관하나" | 메모리에서 제거                                                     |

이게 브라우저 HTTP 캐시의 `stale-while-revalidate`와 같은 철학이다: **일단 있는 걸 보여주고, 갱신은 백그라운드에서.** 사용자는 스피너 대신 콘텐츠를 본다.

이 프로젝트에서의 튜닝 예:

- 무한스크롤 피드: `staleTime: Infinity`. 이미 받은 페이지가 뒤에서 갱신되며 목록이 출렁이는 것보다, 세션 내 불변이 낫다.
- 히어로 프로젝트 프리뷰: `staleTime: Infinity`. 장식적 데이터라 세션당 1회면 충분.
- OG 링크 프리뷰: 24시간. 서버 라우트의 `Cache-Control: max-age=86400`과 **의도적으로 일치**시켰다 — 클라이언트 캐시와 HTTP 캐시가 같은 수명을 갖게.

### initialData — "서버가 이미 준 첫 페이지"를 캐시에 심기

첫 페이지는 Server Component가 이미 렌더해서 props로 내려온다. 이걸 버리고 클라이언트에서 다시 fetch하면 낭비다. `useInfiniteQuery`에 `initialData`로 심으면 **0번의 네트워크 요청으로 캐시가 시작**되고, 이후 페이지만 fetch한다.

```ts
useInfiniteQuery({
  initialPageParam: initialCursor,
  initialData: { pages: [{ items: serverItems, nextCursor }], pageParams: [null] },
  getNextPageParam: last => last.nextCursor,
});
```

### placeholderData: keepPreviousData — 페이지 전환의 깜빡임 제거

댓글에서 정렬/페이지를 바꾸면 키가 바뀌므로 원래는 로딩 상태가 된다. `keepPreviousData`는 **새 데이터가 올 때까지 이전 키의 데이터를 계속 보여준다.** 스켈레톤 플래시가 사라지고, 사용자 눈에는 "목록이 부드럽게 교체"된다.

### 왜 서버 prefetch(HydrationBoundary)는 안 썼나

TanStack 공식 문서의 App Router 패턴(서버에서 prefetch → dehydrate → 클라이언트 hydrate)을 **의도적으로 쓰지 않았다.** 이 사이트의 RQ 대상은 전부 "첫 페인트 이후에 필요해지는 데이터"(지연 로드된 프리뷰, 팝오버 열 때의 옵션, 무한스크롤 다음 페이지)다. 이걸 서버 prefetch로 당기면 **첫 응답(TTFB)이 그 데이터를 기다리느라 느려진다** — 최적화의 정반대. 첫 페인트 데이터는 이미 Server Component + 서버 캐시가 담당하고 있으므로, 역할 분담이 명확하다:

> **첫 화면 = 서버 캐시의 일. 그 이후의 상호작용 = React Query의 일.**

### 뮤테이션 후 갱신 — 낙관적 업데이트를 일부러 안 한 이유

댓글 작성/수정/삭제 후에는 낙관적 업데이트(서버 응답 전에 UI 먼저 반영) 대신 **결정적 재조회**를 한다: 서버에 `fresh: true`로 해당 페이지를 다시 요청 → `setQueryData`로 캐시에 직접 심기 → 형제 페이지들은 `invalidateQueries(..., { refetchType: 'none' })`로 "낡음" 표시만.

이유: 댓글의 정체성이 서버에서 결정된다. id도 서버가 만들고, 페이지 번호도 서버가 clamp하고(존재하지 않는 페이지를 요청하면 마지막 페이지로 보정), 삭제된 부모 글의 표시 규칙도 서버 로직이다. 이걸 클라이언트에서 흉내 내면 **불일치 버그의 온상**이 되는데, 얻는 건 왕복 1번(수백 ms)의 체감 단축뿐. 비용 > 이득.

`refetchType: 'none'`이 왜 중요한가: 무효화가 즉시 refetch를 유발하면, 캐시에 있는 모든 댓글 페이지가 동시에 재요청되는 **refetch 폭풍**이 분다. "낡음 표시만 하고, 그 페이지를 실제로 다시 볼 때 갱신"이 맞는 동작.

---

## 3. Next.js 캐시는 한 개가 아니라 4계층이다

이번 작업으로 각 계층의 역할이 명확해졌다. 요청이 지나가는 순서대로:

```
브라우저 HTTP 캐시 (Cache-Control)
   ↓ miss
[Next 서버] Full Route Cache — 페이지 단위 정적 캐시
   ↓
Request Memoization — 한 요청 안에서의 함수 결과 재사용 (React.cache)
   ↓
Data Cache — 요청을 넘어 살아남는 데이터 캐시 ('use cache' / unstable_cache)
   ↓ miss
DB
```

### Request Memoization: "한 요청 안"의 중복 제거

Next.js 페이지는 같은 함수를 최소 두 번 부른다 — `generateMetadata`에서 한 번(제목/OG 태그용), 페이지 본문에서 한 번. `React.cache()`로 감싸면 **같은 서버 요청 처리 중에는 같은 인자에 대해 한 번만 실행**된다. 응답이 끝나면 사라지는 초단기 캐시.

함정 하나: `cache()`는 인자를 **참조로 비교**한다. `{ locale, page }` 같은 객체를 넘기면 매번 다른 참조라 절대 히트하지 않는다. 그래서 **원시값만 받는 내부 함수**를 만들어 감싸야 한다.

### Data Cache: cacheTag(무엇이 바뀌면) + cacheLife(언제까지)

- `cacheTag('articles')` — 글이 수정/발행되면 `revalidateTag('articles')`로 **이벤트 기반** 무효화.
- `cacheLife({ stale, revalidate, expire })` — **시간 기반** 만료. 이번에 추가한 부분.

두 축은 상호보완이다. 태그는 "내 사이트에서 일어난 변화"를 즉시 반영하고, TTL은 "시간 자체가 조건인 쿼리"(`publish_at <= now()`)와 "놓친 무효화"의 안전망이다. 예약 발행 버그는 정확히 **태그만 있고 TTL이 없어서** 생겼다.

cacheLife의 세 값 읽는 법 (HTTP의 s-maxage / stale-while-revalidate와 대응):

```
cacheLife({ stale: 300, revalidate: 3600, expire: 86400 })
            └ 5분간은 무조건 신선   └ 1시간 지나면 백그라운드 재생성   └ 1일 지나면 폐기(블로킹 재생성)
```

콘텐츠 성격별로 다르게 줬다 — 글/프로젝트는 시간 단위, 방명록/댓글(UGC)은 분 단위. **캐시 수명은 "데이터가 얼마나 자주 변하는가"가 아니라 "낡은 데이터를 얼마나 참을 수 있는가"로 정한다.**

### 브라우저 HTTP 캐시와의 접점

피드 API 라우트는 `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`을 반환한다. 클라이언트 RQ의 기본 `staleTime: 60_000`을 여기에 맞췄다. **캐시 계층 간 수명이 어긋나면**(클라이언트 5분, 서버 1분) 디버깅이 지옥이 된다 — "왜 이 데이터가 보이지?"의 답이 계층마다 달라지기 때문.

---

## 4. DB 왕복 최소화 — 네트워크는 곱셈이 아니라 덧셈으로

### N+1 제거

```ts
// Before: 1 + N번 왕복
const parents = await fetchParents(); // 1번
await Promise.all(
  parents.map(
    p => supabase.from('replies').eq('parent_id', p.id), // N번 (병렬이어도 N개의 요청)
  ),
);

// After: 2번 왕복
const parents = await fetchParents();
const replies = await supabase
  .from('replies')
  .in('parent_id', parentIds) // 1번
  .order('created_at', { ascending: true });
// JS에서 parent_id로 그룹핑 (모든 parentId를 []로 초기화해 "답글 없음"도 표현)
```

`Promise.all`이라 병렬이니 괜찮지 않냐는 반론이 있는데 — 병렬이어도 **연결/요청 오버헤드 × N**이고, DB 입장에선 N개의 쿼리 플랜이다. 한 번에 물어볼 수 있는 걸 나눠 묻지 않는 것이 원칙. 정렬을 단일 쿼리의 `ORDER BY`로 옮기면 그룹핑 후에도 부모별 순서가 보존된다는 점이 포인트.

### 독립 쿼리 병렬화

```ts
// Before: a가 끝나야 b 시작 → 시간 = a + b
const older = await getOlderPage();
const newer = await getNewerRows();

// After: 시간 = max(a, b)
const [older, newer] = await Promise.all([getOlderPage(), getNewerRows()]);
```

단, **진짜 의존이 있는 곳은 병렬화하면 안 된다.** 인기 태그 → 태그 라벨 조회는 앞의 결과(slug 목록)가 뒤의 입력이라 순차가 맞다. 대신 **조합 전체를 캐시 함수로 승격**해서, 워밍된 캐시에서는 DB에 0번 가도록 했다. "병렬화할 수 없으면 캐시하라."

### 외부 API도 같은 원리 (Google Search Console)

어드민 대시보드가 매 방문마다 GoogleAuth 클라이언트를 새로 만들고(토큰 교환 왕복 발생) API를 호출하고 있었다. 두 가지로 해결:

- 클라이언트는 **모듈 레벨 싱글턴**(`??=`)으로 — 프로세스 수명 동안 토큰 재사용.
- 호출 결과는 `unstable_cache(..., { revalidate: 900 })` — 15분 캐시.

여기서 배운 함정: **캐시되는 함수 안에서 `new Date()`를 부르면 안 된다.** 날짜가 캐시 키/결과에 섞이면 캐시가 의미를 잃거나(매번 다름) 낡은 날짜가 굳는다(항상 같음). 시간은 **바깥에서 계산해 인자로** 넘긴다. 같은 이유로 에러 상태도 캐시 바깥에서 처리한다 — 일시적 장애가 15분 동안 캐시되면 안 되니까.

---

## 5. 요약: 무엇을 어디에 캐시하나

| 데이터                            | 캐시 위치               | 수명             | 무효화                      |
| --------------------------------- | ----------------------- | ---------------- | --------------------------- |
| 첫 화면 콘텐츠                    | Next Data Cache         | 시간 단위 TTL    | revalidateTag + cacheLife   |
| 같은 요청 내 중복 호출            | React.cache             | 요청 1회         | 자동                        |
| 상호작용 후 데이터 (피드, 프리뷰) | React Query             | Infinity~분 단위 | 키 변경 / invalidateQueries |
| 사용자 생성 콘텐츠 (댓글)         | React Query + 서버 태그 | 60초             | 뮤테이션 후 결정적 재조회   |
| 외부 API (GSC, OG)                | unstable_cache / RQ     | 15분 / 24시간    | TTL                         |

핵심 교훈 세 줄:

1. **서버 데이터는 상태가 아니라 캐시다** — `useState`+`useEffect`로 서버 데이터를 관리하기 시작하면, 결국 캐시 라이브러리를 재발명하게 된다 (실제로 하고 있었다).
2. **캐시는 계층마다 담당이 다르다** — 첫 페인트는 서버 캐시, 상호작용은 클라이언트 캐시, 중복 호출은 요청 메모이제이션. 계층 간 수명을 맞춰라.
3. **응답 시간은 왕복 횟수의 함수다** — N+1을 `.in()`으로, 독립 쿼리를 `Promise.all`로, 의존 쿼리는 캐시로.
