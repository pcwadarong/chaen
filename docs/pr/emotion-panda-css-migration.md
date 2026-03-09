## 📝 작업 내용

> 이번 PR에서 작업한 내용을 설명해주세요 (이미지 첨부 가능)

1. Panda CSS 도입을 위한 Foundation 설정 추가
2. `styled-system` 생성 경로와 PostCSS 파이프라인 연결
3. Panda 토큰과 글로벌 alias layer 도입으로 legacy CSS 변수 경로 유지
4. Emotion 제거 단계 진행용 PR 문서 생성 및 체크리스트 정리
5. Shared primitives를 Panda recipe와 `className` 병합 패턴으로 전환
6. `srOnly` 계약을 Panda 클래스 기반으로 통일하고 관련 테스트/alias를 정리

<br/>

## 🚨 주요 고민 및 해결 과정

> 주요 고민이나 문제 해결 과정 공유

### 문제

- Emotion 기반 스타일과 Panda CSS를 한동안 공존시켜야 해서, 도입 초기에 빌드 파이프라인이 흔들리면 이후 단계 전체가 막힘
- 기존 `rgb(var(--color-*)))` 기반 스타일을 한 번에 바꾸기 어려워 토큰 소스를 바꾸면서도 legacy 변수 계약을 유지해야 함

### 해결 과정

- Panda 설정은 아직 스타일을 직접 사용하지 않는 최소 구성만 추가하고, Emotion compiler 제거는 마지막 단계로 미룸
- `prepare` 스크립트에서 `panda codegen`과 `cssgen`이 함께 실행되도록 연결해 이후 slice에서 타입/CSS 생성 흐름을 고정
- `panda-legacy-aliases.css`에서 기존 CSS 변수명을 임시 호환하되, 색상 팔레트는 Panda 내장 `gray`/`blue`/`green`/`red`를 기준으로 단순화
- spacing은 Panda 표준 토큰을 그대로 쓰고, 마이그레이션 종료 시 임시 호환 레이어와 도입 과정용 설정을 최종 검토 후 삭제 대상으로 다시 정리
- Shared primitives는 sibling `*.recipe.ts`로 옮기고, 컴포넌트 본문은 `cx(recipe(...), className)`만 사용하도록 고정
- server component로 복구 가능한 `Button`, `Input`, `ThemeIcon`, `ContentCard`, `Pagination`의 스타일 전용 `use client`를 제거
- Vitest는 `styled-system/*` alias를 따로 모르고 있어 server component 테스트가 깨졌으므로 `vitest.config.ts`에도 동일 alias를 추가

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
- [ ] 4단계 Wrapper / Client Shell
- [ ] 5단계 View / Simple Page
- [ ] 6단계 Interactive Features
- [ ] 7단계 Emotion Removal

<br/>

## ✅ 검증 기록

- [x] `pnpm panda:codegen`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [ ] `pnpm test`

`pnpm test`는 Slice 3 반영 후 전체 테스트가 실패 0건으로 끝까지 진행되는 로그를 확인했지만, Vitest 프로세스가 마지막 종료 신호를 반환하지 않아 완료 체크는 보류합니다.

추가 메모:

- `Button`, `Input`, `Textarea`, `ThemeIcon`, `ContentCard`, `Pagination`, `srOnly`는 Panda recipe/class 기반으로 전환 완료
- `getButtonStyle`, `Button.css prop`, `srOnlyStyle`, `srOnlyStyleObject` 의존은 shared layer에서 제거 완료
- 마이그레이션 종료 시 `panda-legacy-aliases.css`, `prepare` 자동 codegen, 테스트 alias 등 임시 호환/운영 보조 장치는 실제 필요성을 다시 검토하고 삭제 대상을 최종 정리해야 함
