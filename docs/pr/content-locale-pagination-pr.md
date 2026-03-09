## 📝 작업 내용

> article/project content 조회, fallback, pagination 구조를 현재 스키마와 UI 요구사항에 맞게 정리합니다.

1. article 상세 조회는 locale fallback 체인을 단일 RPC로 처리하고, project도 같은 공통 fallback 체인을 사용하도록 통일합니다.
2. article/project 목록과 상세 아카이브 목록의 keyset pagination 규칙을 정리하고, 기본 limit을 10으로 통일합니다.
3. 상세 아카이브 목록도 `{ items, nextCursor }` 구조로 바꿔 이후 무한 스크롤 UI를 붙일 수 있게 합니다.
4. `shadow`, `canonical` 같은 레거시 용어와 불필요한 schema 상수 의존성을 제거하고 현재 content schema 기준 이름으로 정리합니다.
5. fallback/pagination 공통 로직은 `shared`로 올려 article/project 엔터티의 중복을 줄입니다.
6. 상세 페이지 좌측 아카이브 목록도 cursor를 감지해 다음 페이지를 이어서 불러오도록 바꿉니다.

<br/>

## 🚨 주요 고민 및 해결 과정

### 문제

- `article_translations`와 `project_translations`는 `ko/en/ja/fr`를 지원하지만 조회 정책이 API마다 달랐습니다.
- 일부 목록/상세 아카이브 조회는 `locale -> ko`까지만 확인했고, 일부는 cursor조차 없는 고정 배열 응답이라 무한 스크롤과 계약이 맞지 않았습니다.
- keyset pagination 후속 조회에서 조인 대상 컬럼명(`id`) 대신 relation key(`article_id`, `project_id`)를 써 500 에러가 날 수 있었습니다.
- `shadow content schema`, `canonical` 같은 과거 cutover 용어가 현재 구조를 잘못 설명하고 있었습니다.
- article/project 상세 목록, project fallback 로직, locale fallback chain 정의가 각각 흩어져 있어 비슷한 코드가 반복되고 있었습니다.
- 상세 페이지 좌측 아카이브는 `{ items, nextCursor }` 형태로 바뀐 뒤에도 실제 UI는 첫 페이지 정적 렌더에 머물러 있어, 서버 계약과 사용자 경험이 아직 연결되지 않았습니다.

### 해결 과정

- 공통 locale fallback 체인을 [`content-locale-fallback.ts`](/home/chaen/programming/chaen/src/shared/lib/i18n/content-locale-fallback.ts) 로 올리고, project도 article과 같은 순서(`요청 locale -> ko -> en -> ja -> fr`)를 사용하도록 맞췄습니다.
- article 상세 조회는 `get_article_translation_with_fallback` RPC로 한 번에 첫 번역을 선택하고, 상세 아카이브/프로젝트 목록은 shared helper로 첫 유효 locale 결과를 고르도록 정리했습니다.
- keyset pagination은 `created_at desc, id desc` 기준으로 통일했고, 기본 limit은 10으로 맞췄습니다.
- 상세 아카이브 목록은 `locale-aware cursor`를 도입해 첫 페이지에서 fallback된 locale을 다음 페이지에서도 그대로 이어서 조회할 수 있게 했습니다.
- 상세 page data loader는 아카이브 목록 조회 실패를 빈 배열로 숨기지 않고 surface하도록 바꿨고, 현재 item prepend도 현재 페이지 크기에 맞춰 보정하도록 수정했습니다.
- 상세 페이지 좌측 아카이브는 [`detail-archive-feed.tsx`](/home/chaen/programming/chaen/src/shared/ui/detail-page/detail-archive-feed.tsx) 로 client feed를 붙여, sidebar scroll 영역을 `IntersectionObserver.root`로 사용해 다음 페이지를 자동 로드하도록 연결했습니다.
- 상세 아카이브 전용 route [`src/app/api/articles/archive/route.ts`](/home/chaen/programming/chaen/src/app/api/articles/archive/route.ts), [`src/app/api/projects/archive/route.ts`](/home/chaen/programming/chaen/src/app/api/projects/archive/route.ts) 를 추가해 목록 페이지와 같은 `{ ok, items, nextCursor }` 계약으로 맞췄습니다.
- 추가 로드 실패 시 observer가 같은 cursor를 무한 재시도하지 않도록 자동 로드를 멈추고 `retry` 버튼으로만 재시도되게 처리했습니다.
- 상세 대상 item을 첫 페이지 앞에 끼워 넣는 보정은 [`prepend-current-archive-item.ts`](/home/chaen/programming/chaen/src/shared/lib/pagination/prepend-current-archive-item.ts) 로 공통화하고, 이때 `nextCursor`도 실제 마지막 렌더링 아이템 기준으로 다시 계산해 누락 없이 다음 페이지를 잇도록 수정했습니다.
- 관련 테스트는 fallback 순서, locale-aware cursor, route/page data/view shape 변경까지 함께 보강했습니다.

<br/>
