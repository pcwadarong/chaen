## 📝 작업 내용

> 이번 PR에서 작업한 내용을 설명해주세요 (이미지 첨부 가능)

1. Panda CSS 도입을 위한 Foundation 설정 추가
2. `styled-system` 생성 경로와 PostCSS 파이프라인 연결
3. Panda 토큰과 글로벌 CSS 레이어 도입
4. Emotion 제거 단계 진행용 PR 문서 생성 및 체크리스트 정리
5. Shared primitives를 Panda `cva`/`className` 패턴으로 전환
6. `srOnly` 계약을 Panda 클래스 기반으로 통일하고 관련 테스트를 정리
7. Wrapper / Client Shell의 정적 프레임을 Panda class 기반으로 전환
8. View / Simple Page와 detail fallback 화면을 Panda `css()` 기반으로 전환하고 server component를 복구
9. Interactive feature와 global nav의 Emotion 프레임 스타일을 Panda class 기반으로 전환
10. 남아 있던 `module.css` 기반 server component 스타일을 Panda `css()` 파일로 통일
11. 스타일 때문에 분리됐던 leaf client component를 공용/server component로 다시 합침
12. Emotion 의존성, Next compiler 설정, css-prop 타입 선언 제거
13. 남아 있던 `use client` 파일을 재검토해 불필요한 client boundary를 추가로 축소
14. global nav의 plain button/button-like 인터랙션을 공용 `Button` 패턴으로 정리하고 중복 CSS를 삭제
15. `Button`을 `sva(root/label/visual)`로 리팩토링해 variant 초기화 비용을 제거
16. `DetailPageShell` 머지 충돌을 Panda 기준으로 정리하고 archive list/feed 스타일을 module.css 없이 복구

<br/>

## 🚨 주요 고민 및 해결 과정

> 주요 고민이나 문제 해결 과정 공유

### 문제

- Emotion 기반 스타일과 Panda CSS를 한동안 공존시켜야 해서, 도입 초기에 빌드 파이프라인이 흔들리면 이후 단계 전체가 막힘
- 기존 `rgb(var(--color-*)))` 기반 스타일을 새 토큰 표현으로 치환하면서도 화면 parity를 유지해야 함

### 해결 과정

- Panda 설정은 아직 스타일을 직접 사용하지 않는 최소 구성만 추가하고, Emotion compiler 제거는 마지막 단계로 미룸
- `prepare` 스크립트에서 `panda codegen`과 `cssgen`이 함께 실행되도록 연결해 이후 slice에서 타입/CSS 생성 흐름을 고정
- 색상 팔레트는 Panda 내장 `gray`/`blue`/`green`/`red`를 기준으로 단순화하고, 남아 있던 legacy `var(--color-*)` 사용부는 Panda semantic token과 단순한 색 값으로 치환
- spacing은 Panda 표준 토큰을 그대로 쓰고, `main.css`도 Panda prefix(`--spacing-*`, `--font-sizes-*`, `--line-heights-*`, `--fonts-*`) 기준으로 정리
- Shared primitives와 공용 UI는 분리된 `*.recipe.ts` 없이 각 컴포넌트 파일 안에서 `cva()`/`css()`를 co-location 하도록 최종 통일
- server component로 복구 가능한 `Button`, `Input`, `ThemeIcon`, `ContentCard`, `Pagination`의 스타일 전용 `use client`를 제거
- Vitest는 `styled-system/*` alias를 따로 모르고 있어 server component 테스트가 깨졌으므로 `vitest.config.ts`에도 동일 alias를 추가
- `Modal`은 `frameStyle` 대신 `frameClassName`으로 프레임 확장 포인트를 통일하고, `ImageViewerModal`은 확대 배율만 runtime `style`로 남기고 나머지 프레임은 Panda class로 이동
- `Toast`, `ActionPopover`, `SwitcherPopover`의 wrapper 프레임과 액션 버튼은 Emotion `css`가 아닌 Panda `css()/cva()` 기반 정적 클래스만 사용
- `ResumePage`, `ArticlesPage`, `ProjectListPage`, `HomePage`, `AdminPage`, `ProjectShowcase`, `ArticleListItem`은 스타일만으로 붙어 있던 `use client`를 제거하고 Panda `css()` 클래스로 치환
- `ArticleCard`, `ProjectCard`는 API 변경 없이 shared 컴포넌트로 복구했고, `useLocale()`는 server/client 공용 훅으로 그대로 유지
- `app/[locale]/articles/[id]`, `app/[locale]/project/[id]`의 `loading.tsx`, `not-found.tsx`는 server component로 복구하고 `error.tsx`만 client 제약을 유지한 채 Panda class로 교체
- `ArticleFeed`, `ArticleSearchForm`, `ArticleTagFilterList`, `ProjectFeed`, `GuestbookFeed`, `GuestbookBoard`, `AdminLoginForm`, `AdminSignOutButton`의 정적 스타일을 Panda `css()`/`cx()` 기반으로 교체
- `GlobalNav`, `GlobalNavDesktopContent`, `GlobalNavMobileMenu`, `LocaleSwitcher`, `ThemeSwitcher`의 interactive shell을 Panda class 기반으로 전환하고 버튼 확장은 `buttonRecipe + className` 패턴으로 고정
- `PageShell`, `AppFrame`, `DetailPageShell`, `MarkdownRenderer`, article/project detail page의 `module.css`를 Panda 스타일 파일로 교체해 스타일 레이어를 단일화
- `CommentComposeActions`, `CommentComposeProfileFields`, `CommentComposeContentField`, `CommentComposeReplyPreview`, `GlobalNavDesktopContent`, `GuestbookEntryBubble`, `GuestPage`, `ContactStrip`은 불필요한 `use client`를 제거해 server/shared component로 복구
- 최종 단계에서 `@emotion/react`, `@emotion/styled`, `next.config.ts`의 Emotion compiler, `emotion-css-prop.d.ts`를 삭제해 Emotion runtime 의존을 0건으로 정리
- 최종 정리에서 `panda-legacy-aliases.css`를 삭제하고 `src/app/styles/main.css`는 `src/app/main.css`로 이동해 `styles/` 폴더를 제거함
- 이후 추가 점검으로 `GuestbookEntryActionMenu`, `HomeHeroWebUi`, `DownloadFileButton`, auth/guestbook/article client helper 모듈에서 불필요한 `use client`를 제거해 client file 수를 48 -> 41로 축소
- project/article 영역 이름 충돌은 경로 기준으로 재검색했지만 안전하게 바꿔야 할 실질적 오명명 사례는 확인되지 않아 이번 커밋에서는 리네임하지 않음
- lint/typecheck 기준으로 남아 있는 미사용 코드나 죽은 export는 추가로 발견되지 않았고, 마이그레이션 과정에서 생긴 `*.styles.ts` 임시 파일은 모두 제거 완료
- global nav mobile 햄버거/닫기 트리거와 desktop nav 링크는 공용 `Button` 기준으로 정리해 중복 interaction CSS를 줄이고 `aria-haspopup`, 장식용 아이콘 `aria-hidden`을 보강
- `Button`은 `sva`의 `root/label/visual` 슬롯으로 재구성해 base에서 border/background를 제거하고, variant별 책임과 외부 recipe 사용처의 `root` 슬롯 접근을 명확히 분리
- `DetailPageShell`, `DetailArchiveList`, `DetailArchiveFeed`는 분리된 archive list 구조를 유지하되 Panda co-location 스타일로 재구성해 shell/feed/list 사이의 레이아웃 계약을 다시 맞춤

<br/>

## 📑 참고 문서/ ADR

> 참고한 외부 문서, 레퍼런스, 기술 블로그, 공식 문서 등의 링크

- https://panda-css.com/docs/installation/nextjs
- https://panda-css.com/docs/references/config
- https://panda-css.com/docs/theming/tokens
- https://panda-css.com/docs/concepts/cascade-layers

<br/>

## ✅ 진행 체크

- [x] 1단계 Foundation
- [x] 2단계 Token System + Global Layer
- [x] 3단계 Shared Primitives
- [x] 4단계 Wrapper / Client Shell
- [x] 5단계 View / Simple Page
- [x] 6단계 Interactive Features
- [x] 7단계 Emotion Removal

<br/>

## ✅ 검증 기록

- [x] `pnpm panda:codegen`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [ ] `pnpm test`

`pnpm test`는 최종 정리 후 전체 스위트가 실패 로그 없이 끝까지 진행되는 것을 다시 확인했고, `article-comments-section`, `comment-compose-form` 영향 범위는 별도 재실행으로 green 확인했습니다. 다만 Vitest 프로세스가 마지막 종료 신호를 반환하지 않는 기존 문제가 남아 있어 완료 체크는 보류합니다.

추가 메모:

- `Button`, `Input`, `Textarea`, `ThemeIcon`, `ContentCard`, `Pagination`, `srOnly`는 Panda `cva`/class 기반으로 전환 완료
- `getButtonStyle`, `Button.css prop`, `srOnlyStyle`, `srOnlyStyleObject` 의존은 shared layer에서 제거 완료
- `Modal`, `ToastViewport`, `ActionPopover`, `SwitcherPopover`, `ImageViewerModal`의 정적 shell 스타일은 Panda class 기반으로 전환 완료
- `frameStyle` API는 `frameClassName`으로 교체 완료
- server-page 렌더 테스트 2건은 React server stream 기반으로 유지하되 transform 시간이 길어 timeout을 30초로 상향
- `ResumePage`, `ArticlesPage`, `ProjectListPage`, `HomePage`, `AdminPage`, `ProjectShowcase`, `ArticleListItem`는 Panda `css()` 기반으로 전환 완료
- `ArticleCard`, `ProjectCard`는 `use client`를 제거한 shared 컴포넌트로 복구 완료
- `articles/[id]`, `project/[id]`의 `loading`/`not-found`는 server component로, `error`는 client component로 역할 분리 완료
- `ArticleFeed`, `ArticleSearchForm`, `ArticleTagFilterList`, `ProjectFeed`, `GuestbookFeed`, `GuestbookBoard`, `AdminLoginForm`, `AdminSignOutButton`는 Panda class 기반으로 전환 완료
- `GlobalNav`, `GlobalNavDesktopContent`, `GlobalNavMobileMenu`, `LocaleSwitcher`, `ThemeSwitcher`는 Emotion 없이 Panda class 조합만 사용하도록 정리 완료
- `PageShell`, `AppFrame`, `DetailPageShell`, `MarkdownRenderer`, article/project detail page의 `module.css`는 모두 제거 완료
- Emotion import 검색 결과는 `src`, `next.config.ts`, `package.json`, `pnpm-lock.yaml` 기준 0건
- `build`는 최종 기준 통과, 테스트 중 기존 Next/Image `fill` 경고 1건은 별도 잔여 이슈로 유지
- `panda-legacy-aliases.css`와 `*.recipe.ts`는 최종 정리에서 모두 제거 완료
- `src/app/styles/` 폴더는 비우고 `main.css`를 `src/app/main.css`로 이동 완료
- `prepare` 자동 codegen과 테스트 alias는 운영 보조 장치로 남아 있으므로 실제 필요성을 계속 검토해야 함
