# 03. 자산 캐시 헤더 — `perf/3d-asset-cache-headers`

- **효과**: 재방문 시 3D 자산 재검증 왕복 제거 (48MB → 0 바이트)
- **의존**: 없음. **가장 작고, 다른 브랜치가 참조할 경로 상수를 만드므로 먼저 병합할 것**
- **위험도**: 중간 — `immutable`은 잘못 쓰면 자산 갱신이 사용자에게 영영 안 간다
- **관련 발견**: F-6

---

## 프롬프트

```
`docs/3d-performance/README.md`를 먼저 읽어라. 이 작업은 그 문서의 F-6을 해결한다.

## 배경

`next.config.ts`에 `headers()`가 없다. Next.js는 `public/`의 정적 파일을
`Cache-Control: public, max-age=0`으로 내보내므로, 48MB의 3D 자산이 매 방문·매 리로드마다
최소한 조건부 요청(304) 왕복을 한다. 자산 자체는 거의 안 바뀌는데도.

## 목표

`/models/*`와 `/textures/*`를 장기 immutable 캐시로 바꾸되, **갱신 경로를 안전하게 확보**한다.

### A. 자산 경로와 버전을 한 곳으로 모은다

지금 3D 자산 경로가 네 군데에 흩어져 있다:

| 위치 | 내용 |
|---|---|
| `src/entities/scene/model/preloadGLB.ts` | `sceneModelPaths` (GLB 4종) |
| `src/entities/character/model/use-character-instance.ts:60` | `useGLTF('/models/character.glb')` |
| `src/entities/scene/ui/scene-prop.tsx` | `path` prop 유니온 타입 + `useGLTF(path)` |
| `src/entities/character/lib/use-character-materials.ts` | `CHARACTER_ORM_TEXTURE_PATHS` |
| `src/entities/scene/lib/use-scene-prop-materials.ts` | `PROP_ORM_TEXTURE_PATHS` |

`src/entities/scene/model/scene-asset-paths.ts`(FSD상 entities/scene/model)로 통합한다.
`preloadGLB.ts`는 이 모듈을 쓰도록 재편한다 (기존 `preloadSceneGlbs` 시그니처는 유지해서
`scene-asset-preloader.tsx`와 그 테스트가 깨지지 않게 하라).

**무효화 수단은 `.vN` 파일명 접미사다** — `gltf-pipeline` 스킬 Step 6이 이미 이 저장소의
관례로 정해둔 방식이다. `?v=` 쿼리나 콘텐츠 해시를 새로 도입하지 마라.

```
public/models/character.glb  →  public/models/character.v2.glb
```

쿼리 버전 대비 이점: 파일별로 무효화된다. 캐릭터 GLB만 바뀌었는데 텍스처 5종까지
전부 다시 받게 만들 이유가 없다. 콘텐츠 해시 대비 이점: 자산을 빌드 산출물로 만들지
않아도 된다 — 개인 포트폴리오 규모에 과하다.

경로 상수를 한곳에 모으는 것 자체가 이 방식의 전제다. 파일명만 올리고 참조를 안 고치면
이전 버전이 캐시된 채 계속 서빙되는데, 경로가 5곳에 흩어져 있으면 반드시 하나를 빠뜨린다.

### B. `next.config.ts`에 헤더 추가

```ts
async headers() {
  return [
    {
      source: '/models/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/textures/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
  ];
}
```

`/music/*`도 같은 성격(총 2.7MB, 거의 안 바뀜)이니 포함을 검토하라.

### C. 갱신 절차를 문서화

`.vN`을 언제 올려야 하는지를 `scene-asset-paths.ts` 상단 한국어 JSDoc에 명시하라.
**브랜치 `01`과 `06`이 자산을 통째로 교체하므로, 그 브랜치들은 병합 시 `.vN`을 반드시
올려야 한다.** `gltf-pipeline` 스킬 Step 6과 같은 규칙이므로, 스킬을 단일 출처로 링크하고
여기서 규칙을 복제하지 마라.

## 하지 말 것

- 자산 파일 자체를 건드리지 마라 (브랜치 `01`).
- 프리로더의 **마운트 위치**를 옮기지 마라 (브랜치 `02`). 이 브랜치는 경로 정의만 다룬다.
- 콘텐츠 해시 파일명이나 빌드 타임 자산 파이프라인을 도입하지 마라. 과설계다.
- `next.config.ts`의 webpack/turbopack/images 설정을 건드리지 마라.

## 검증

1. `pnpm run check-types && pnpm run lint && pnpm run test:vitest`
   - 경로 상수를 옮기면 `scene-asset-preloader.test.tsx`, `scene-prop` 관련 테스트,
     `use-character-materials.test.ts`가 영향받을 수 있다.
2. **헤더는 dev 서버가 아니라 프로덕션 빌드에서 확인해야 한다:**
   ```
   pnpm build && pnpm start
   curl -sI http://localhost:3000/models/character.glb | grep -i cache-control
   curl -sI http://localhost:3000/textures/skin_ORM.png | grep -i cache-control
   ```
   `public, max-age=31536000, immutable`이 나와야 한다.
3. DevTools Network에서 리로드 시 `(disk cache)`로 뜨는지, 조건부 요청이 사라졌는지 확인.
4. `.vN`을 한 칸 올렸을 때 새 URL로 재요청되는지 확인.
5. `pnpm run test:browser:smoke`

## 커밋 분할 제안

1. `♻️ refactor: 3D 자산 경로를 scene-asset-paths로 통합`
2. `🔧 chore: models/textures에 immutable 캐시 헤더 추가`

`⚡ perf:`를 쓸 경우 변형 선택자 없는 U+26A1 `⚡`여야 husky 훅을 통과한다.

## PR 문서

`docs/pr/3d-asset-cache-headers.md`. 설계 섹션에 "왜 콘텐츠 해시가 아니라 `.vN` 파일명인가",
"immutable의 함정과 그걸 어떻게 막았는가"를 쓸 것. 후속 섹션에 브랜치 01·06 병합 시
`.vN`을 올려야 한다는 점을 명시.
```
