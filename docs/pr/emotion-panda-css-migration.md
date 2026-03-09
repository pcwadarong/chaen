## 📝 작업 내용

> 이번 PR에서 작업한 내용을 설명해주세요 (이미지 첨부 가능)

1. Panda CSS 도입을 위한 Foundation 설정 추가
2. `styled-system` 생성 경로와 PostCSS 파이프라인 연결
3. Emotion 제거 단계 진행용 PR 문서 생성 및 체크리스트 정리

<br/>

## 🚨 주요 고민 및 해결 과정

> 주요 고민이나 문제 해결 과정 공유

### 문제

- Emotion 기반 스타일과 Panda CSS를 한동안 공존시켜야 해서, 도입 초기에 빌드 파이프라인이 흔들리면 이후 단계 전체가 막힘

### 해결 과정

- Panda 설정은 아직 스타일을 직접 사용하지 않는 최소 구성만 추가하고, Emotion compiler 제거는 마지막 단계로 미룸
- `prepare` 스크립트에서 `panda codegen`이 실행되도록 연결해 이후 slice에서 타입 생성 흐름을 고정

<br/>

## 📑 참고 문서/ ADR

> 참고한 외부 문서, 레퍼런스, 기술 블로그, 공식 문서 등의 링크

- https://panda-css.com/docs/installation/nextjs
- https://panda-css.com/docs/references/config

<br/>

## ✅ 진행 체크

- [x] 1단계 Foundation
- [ ] 2단계 Token System + Global Layer
- [ ] 3단계 Shared Primitives
- [ ] 4단계 Wrapper / Client Shell
- [ ] 5단계 View / Simple Page
- [ ] 6단계 Interactive Features
- [ ] 7단계 Emotion Removal

<br/>

## ✅ 검증 기록

- [x] `pnpm panda:codegen`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
