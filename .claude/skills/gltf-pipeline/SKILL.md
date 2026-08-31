---
name: gltf-pipeline
description: chaen의 3D 씬(react-three-fiber)에서 GLB 모델·텍스처를 수정·최적화할 때 지켜야 할 이름 조회 제약, gltf-transform 금지 목록, KTX2/Basis 텍스처 압축 절차를 다루는 스킬. "GLB 최적화", "모델 압축", "텍스처 최적화", "3D 에셋 수정", "gltf-transform", "KTX2", "basis", "VRAM 줄이기" 요청 시 트리거한다. 씬 컴포넌트 구현 자체(카메라·조명·애니메이션 배선)는 다루지 않는다.
---

# Gltf-Pipeline — GLB/텍스처 수정 시 이름 조회 안전 규칙

chaen 런타임은 GLB 안의 메시/노드를 **정확한 이름 문자열로 조회**한다. gltf-transform 같은 최적화 도구는 기본적으로 노드를 병합·리네임하므로, 절차를 따르지 않으면 빌드는 성공하는데 런타임에서 조용히 머티리얼이 안 붙거나 메시가 사라진다.

> 규칙 기준: 없음(이 저장소의 3D 파이프라인 자체가 아직 `AGENTS.md`에 문서화되어 있지 않다 — 이 스킬이 단일 출처다). 씬 컴포넌트 작성은 `component` 스킬을 함께 참조.

## Step 1: 이름 조회 의존 목록부터 확인한다

수정 대상 GLB가 아래 파일들이 참조하는 이름을 포함하는지 먼저 grep한다:

```bash
grep -rn "laptop_screen\|frame_screen\|laptop_cover\|laptop_logo" src/
```

현재 알려진 이름 조회 지점 (파일별로 정확히 분리 — 어디를 고쳐야 하는지가 달라진다):

| 파일                                                     | 조회하는 이름                                                                                                                                                                                                 | 용도                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `entities/character/lib/use-character-materials.ts`      | `body` `face` / `brows` `eyebrow` `hair` / `inner` `neck_collar` `outer` `pants` `ribon` `sock` / `headphone_band` `headphone_housing` `headphone_pads` `heart` `laptop` `laptop_cover` `shoes` `shoes_strip` | ORM 텍스처 주입 (skin/hair/outfit/gear 4집합) |
| ″                                                        | `laptop_screen`                                                                                                                                                                                               | 런타임 모니터 texture 주입                    |
| `entities/character/model/prepare-character-instance.ts` | `laptop` `laptop_screen` / `brows` `eyebrow` / `hair` / `outer` `pants` `ribon` / `heart`                                                                                                                     | contact 숨김·양면화·tint·초기 비표시          |
| `entities/character/model/use-character-instance.ts`     | `heart` `laptop` `brows` `eyebrow` `face`                                                                                                                                                                     | node 참조 수집                                |
| `entities/scene/lib/use-scene-prop-materials.ts`         | `frame_screen`                                                                                                                                                                                                | ORM 제외 + 액자 이미지 주입                   |

> **검증된 유령 이름 — 코드엔 있는데 GLB엔 없다.** 매칭이 안 되므로 동작에 영향은 없지만,
> 이 목록을 근거로 "이 이름이 살아있으니 안전하다"고 판단하면 안 된다.
>
> | 이름          | 있는 곳                                                                             |
> | ------------- | ----------------------------------------------------------------------------------- |
> | `laptop_logo` | `use-character-materials.ts`의 `GEAR_MESH_NAMES`                                    |
> | `monitor`     | `prepare-character-instance.ts`의 `CONTACT_HIDDEN_NODE_NAMES`                       |
> | `head`        | `use-character-instance.ts`의 `findCharacterNodeRefs` (`face` 폴백이 실제로 걸린다) |

**이 목록에 없는 새 메시 이름을 발견하면, 실제 소비 코드를 먼저 찾아 목록에 추가한 뒤 다음 단계로 간다.** 목록이 최신이 아닌 채로 최적화를 진행하지 않는다.

현재 `character.glb`의 실제 mesh 노드 22개 (변환 후 이게 전부 남아야 한다):

```
eye_left  eye_right  hair  headphone_band  headphone_housing  headphone_pads
body  brows  eyebrow  face  inner  neck_collar  outer  pants  ribon
shoes  shoes_strip  sock  laptop_cover  laptop_screen  laptop  heart
```

## Step 2: 절대 금지 함수 (모든 GLB 공통)

다음은 노드 병합/리네임을 일으키므로 **어떤 GLB에도 적용하지 않는다**:

- `flatten()` — 노드 계층을 평탄화하며 이름 있는 중간 노드가 사라질 수 있음
- `join()` — 여러 메시를 하나로 합쳐 개별 이름이 소멸
- `palette()` — 머티리얼을 팔레트 텍스처로 통합, 개별 머티리얼 참조 깨짐
- `instance()` — 동일 메시를 인스턴스화하며 원본 노드 구조 변경
- `simplify()` — 지오메트리 단순화 과정에서 메시 분리/병합 발생 가능
- 사전 정의된 `optimize` 프리셋 전체 — 위 함수들을 내부적으로 묶어 실행

`gltf-transform optimize` CLI 명령이나 `functions` API의 `optimize()` 헬퍼를 그대로 쓰지 않는다 — 반드시 개별 함수를 명시적으로 나열해 파이프라인을 구성한다.

## Step 3: 캐릭터(스킨드 메시) 추가 금지 목록

캐릭터처럼 스켈레톤 애니메이션이 있는 GLB는 위 공통 금지에 더해:

- `weld()` — 모프 타깃 seam 버텍스를 병합해 블렌드셰이프가 뭉개짐
- 단독 `quantize()` — POSITION/WEIGHTS를 공격적으로 양자화해 스키닝이 뒤틀림(양자화가 꼭 필요하면 스킨 관련 속성을 제외한 옵션으로만)

캐릭터 GLB에서 허용되는 안전한 방향(참고, 강제 아님): `dedup()`, `prune({keepAttributes:true})`(모프/스킨 속성 보존 옵션), 텍스처 압축, 무손실 계열 리샘플링.

## Step 4: 변환 후 검증

```bash
npx gltf-transform inspect <파일>.glb
```

- 변환 전/후 노드 이름 목록을 비교해 Step 1에서 확인한 이름이 전부 그대로 있는지 확인한다.
- 애니메이션 클립 개수와 duration이 변환 전후 동일한지 확인한다(런타임이 clip duration을 읽는 코드가 있다면 특히).

## Step 5: KTX2/Basis 텍스처 압축

### 먼저: 압축이 아니라 제거가 우선이다

chaen은 GLB 안의 roughness/metallic 텍스처를 **런타임에 외부 ORM으로 덮어쓴다**
(`applyCharacterMaterials`, `applyScenePropMaterials`). 덮어써질 텍스처를 압축하는 건 낭비다.
**압축 전에 반드시 죽은 텍스처를 먼저 제거한다.**

어떤 텍스처가 덮어써지는지 판단하는 법 — `use-character-materials.ts`의 네 이름 집합
(`SKIN_MESH_NAMES` / `HAIR_MESH_NAMES` / `OUTFIT_MESH_NAMES` / `GEAR_MESH_NAMES`)에
노드 이름이 걸리면 그 머티리얼의 `aoMap`/`roughnessMap`/`metalnessMap`은 전부 교체된다.
소품은 `frame_screen`을 뺀 **모든** 메시가 room ORM으로 교체된다.

> **함정:** 집합에 안 걸리는 노드가 있다. `eye_left`/`eye_right`(머티리얼 `눈`)는 네 집합
> 어디에도 없어서 GLB 안 `skin_roughness`를 계속 쓴다. 이걸 모르고 지우면 눈만 조용히 밋밋해진다.
> 지우기 전에 **노드 이름 → 집합 매칭을 전수 확인**할 것.

### 왜 PNG 최적화로는 부족한가

GPU VRAM은 **파일 크기가 아니라 해상도가 결정한다.** PNG는 디코딩 후 RGBA8로 업로드되므로
2048² 텍스처 하나가 밉맵 포함 약 21MB를 먹는다. PNG를 아무리 잘 줄여도 VRAM은 1바이트도 안 줄어든다.
KTX2는 GPU 압축 포맷을 그대로 올리므로 파일과 VRAM이 **함께** 준다.

또한 chaen 홈은 **canvas가 2개**(hero + contact)라 WebGL 컨텍스트가 둘이고,
같은 텍스처가 각 컨텍스트에 **따로 업로드**된다. VRAM 절감 효과가 두 배로 중요하다.

### 포맷 선택

| 텍스처 종류                  | 포맷      | 이유                                                                                                            |
| ---------------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| baseColor                    | ETC1S     | 압축률 우선. 색상은 아티팩트가 덜 보인다                                                                        |
| **ORM (roughness/metal/AO)** | **UASTC** | ETC1S는 RGB를 공동 인코딩해 채널이 서로 번진다. ORM은 R/G/B가 독립 신호라 이 번짐이 그대로 셰이딩 오류로 보인다 |
| **normal map**               | **UASTC** | ETC1S로 압축하면 노멀이 눈에 띄게 깨진다. 예외 없음                                                             |

> **ORM을 ETC1S로 굽지 마라 — 실측으로 확인됐다.** 노트북 커버의 "Chaen" 각인은
> baseColor가 아니라 `gear_ORM`의 roughness 대비로 보이는데, ETC1S로 구우니 획이 끊기고
> 번져 보였다. 포맷(ETC1S/UASTC)·RDO·mipmap 생성을 각각 바꿔 가며 좁힌 결과 원인은
> **ETC1S의 채널 스미어 하나**였고, ORM만 UASTC로 바꾸자 원본과 구분되지 않았다.
>
> UASTC는 파일이 커지므로 **ORM 해상도를 baseColor보다 한 단계 낮추는 것**으로 상쇄한다.
> ORM은 색이 아니라 셰이딩 계수라 텍셀 밀도 요구가 낮다 (chaen은 2048² → 1024²).
>
> **VRAM 계산 시 주의:** 전송 포맷은 GPU가 정한다. three `KTX2Loader`는 BPTC를 지원하는
> 데스크톱에서 ETC1S도 UASTC도 **BC7(1바이트/텍셀)**로 푼다 — 이 경우 ETC1S를 골라도
> VRAM 이득은 없고 파일만 작아진다. ETC1S의 VRAM 이득(ETC1 0.5바이트/텍셀)은
> ETC2만 지원하는 모바일에서 나온다.

### 인코더

`gltf-transform`의 `etc1s` / `uastc` **CLI 커맨드는 쓰지 않는다.** 시스템에 KTX-Software
바이너리를 요구해 재현이 어렵고(`basis_universal` npm 패키지는 리눅스 바이너리만 담고 있어
macOS에서 돌지 않는다), 플랫폼을 타지 않는 wasm 인코더인 **`ktx2-encoder`**를 devDependency로
쓴다. 프리셋은 `scripts/ktx2-presets.mjs` 한곳에 모아 GLB 안팎을 같은 규칙으로 굽는다.

압축은 텍스처 데이터만 건드리고 **노드나 머티리얼 이름은 손대지 않으므로** Step 2·3의 금지
목록과 충돌하지 않는다. 다만 `slots`(`normalTexture` 등)와 `pattern`으로 대상을 갈라
normal/ORM만 UASTC로 보내야 한다.

> **함정:** `ktx2` 트랜스폼은 인코딩 실패를 `logger.warn`으로만 남기고 그 텍스처를 원본
> 포맷 그대로 통과시킨다. 로그를 놓치면 절반만 변환된 에셋이 조용히 배포되므로,
> 변환 후 **모든 텍스처가 `image/ktx2`인지 확인하고 아니면 빌드를 세운다**
> (`assertAllTexturesAreKtx2`).

### 로더 배선 (여기가 실제로 어려운 부분)

**1. transcoder를 self-host한다.** CDN 의존을 만들지 않는다.

`pnpm sync:decoders`(`scripts/sync-decoders.mjs`)가 `three/examples/jsm/libs`에서
`public/decoders/{basis,draco}/`로 복사한다. 디코더는 three 버전과 짝이 맞아야 하므로
**three를 올린 뒤에는 이 스크립트를 다시 돌린다.**

**2. `KTX2Loader`는 실제 `WebGLRenderer`로 `detectSupport()`를 호출해야 한다.**
지원 포맷(ASTC/ETC/BC/PVRTC)을 렌더러에서 질의하기 때문이다. 렌더러 없이 만든 로더는
transcode 단계에서 실패한다.

**3. drei `useGLTF`에는 네 번째 인자 `extendLoader`로 물린다.**
chaen에서는 `entities/scene/model/use-scene-gltf.ts`가 씬 GLB를 여는 유일한 통로이고,
`useGLTF.setDecoderPath`도 여기 모여 있다.

```ts
const gl = useThree(state => state.gl);
useGLTF(path, true, true, loader => {
  loader.setKTX2Loader(resolveKtx2Loader(gl));
});
```

> **함정 (chaen 고유):** canvas가 2개다. 두 렌더러의 지원 포맷 집합이 다를 수 있어
> "전역 싱글턴 금지"가 직관이지만, **로더를 나눠도 공유는 사라지지 않는다.** R3F `useLoader`는
> 로드 결과를 URL 단위로 전역 캐시하므로 KTX2는 먼저 로드한 컨텍스트의 포맷으로 한 번만
> transcode되고, GLB도 한 번 파싱해 두 씬이 clone해 쓴다. 로더를 나누면 GLB를 두 번 받을 뿐이다.
>
> 그래서 chaen은 **인스턴스 하나 + `detectSupport` 최초 1회**로 가고, 두 번째 렌더러에서는
> *버릴 로더*로 감지해 포맷 집합이 같은지 **검증만** 한다(`shared/lib/three/ktx2-loader.ts`).
> 공유 로더에 `detectSupport`를 다시 부르면 안 된다 — `KTX2Loader`는 worker를 만들 때 그 시점의
> `workerConfig`를 구워 넣으므로, 덮어쓰면 한 pool 안에 설정이 다른 worker가 섞인다.
>
> 인스턴스를 하나로 유지하는 방법: R3F `useLoader`는 생성자뿐 아니라 **로더 인스턴스**도 받는다.
> 생성자를 넘기면 클래스마다 인스턴스가 따로 생겨 worker pool과 transcoder wasm이 이중으로 뜬다.

**4. `public/textures/*`는 GLB 밖에 있다.** `useTexture`(drei)는 KTX2를 못 읽는다.
drei의 `useKTX2`도 쓰지 않는다 — three-stdlib의 KTX2Loader를 쓰고 transcoder 기본 경로가
외부 CDN이라, 자체 호스팅한 transcoder와 구현이 갈린다. 대신 `shared/lib/three/use-ktx2-textures.ts`
(공유 로더를 `useLoader`에 그대로 넘긴다)로 교체하는 호출 지점:

- `entities/character/lib/use-character-materials.ts` — ORM 4종
- `entities/scene/lib/use-scene-prop-materials.ts` — room ORM

> **함정 (해소됨):** `prepareOrmTexture`의 `flipY = false`는 KTX2에서도 그대로 맞다.
> `CompressedTexture`는 **생성자가 이미 `flipY = false`**이기 때문이다. `colorSpace`도
> KTX2 DFD의 transfer function 판정과 같은 값이 나온다 — ORM은 `NoColorSpace`,
> baseColor는 `SRGBColorSpace`. 둘 다 명시적 가드로 남겨 두면 된다.

**5. Draco 디코더도 같이 self-host한다.** drei `useGLTF`는 기본으로 DRACOLoader를 준비하며
외부 CDN 경로를 세팅하므로, `useGLTF.setDecoderPath('/decoders/draco/')`로 덮는다.
지오메트리는 Meshopt로 압축돼 있어 실제로 쓰이진 않지만 방어적으로 유지한다.

### 폴백

`detectSupport`가 아무 포맷도 못 찾으면 로드가 실패한다. PNG를 병행 유지하면 자산이 두 벌이
되므로 **권장하지 않는다.** 대신 로드 실패를 조용히 삼키지 말고 기존 `SceneBrowserFallback`
경로로 떨어뜨린다 (`use-scene-webgl-availability.ts`에 이미 가용성 판단 훅이 있다).

### 검증

```js
renderer.info.memory; // { geometries, textures } — **개수**다. 바이트가 아니다
```

VRAM 바이트를 재려면 WebGL 컨텍스트의 `texStorage2D` / `compressedTexImage2D` 호출을 가로채
`internalformat`과 밉 레벨 수로 할당량을 합산한다. 캔버스가 2개면 컨텍스트별로 따로 집계하고,
렌더 타깃(그림자·postprocessing)은 밉맵이 없으므로 에셋 텍스처와 분리해서 본다.

- **화질 비교 지점** (전후 같은 카메라 위치 스크린샷):
  얼굴 클로즈업(피부 그라데이션·눈) / 머리카락 알파 경계 / 옷(가장 큰 텍스처) /
  헤드폰·노트북 금속 표면(ORM 정밀도가 낮으면 여기서 티가 난다) / 소품 나뭇결
- **Safari(iOS 포함)를 반드시 확인한다.** 지원 포맷이 달라 Safari에서만 깨지는 사례가 흔하다.
- 색이 달라 보이면 **압축 설정을 조정한다. 조명이나 톤매핑을 만지지 않는다.**

## Step 6: 캐시 버스팅 — `.vN` 파일명 버전

원본을 덮어쓰지 않는다. 내용이 바뀌면 파일명 접미사를 올린다: `character.glb` → `character.v2.glb`. `public/` 정적 파일은 Next가 콘텐츠 해싱을 하지 않으므로, 장기 캐시 헤더(`immutable`)를 걸려면 이 버전 접미사가 유일한 무효화 수단이다. 경로를 참조하는 모든 지점(경로 상수 파일, 프리로드 목록)을 새 버전 파일명으로 함께 갱신한다 — 파일만 바꾸고 참조를 안 바꾸면 이전 버전이 캐시되어 계속 서빙된다.

## 자가 확인

- [ ] 수정 대상 GLB가 참조하는 모든 이름 조회 지점을 grep으로 확인했는가? 새 이름을 발견했다면 목록에 추가했는가?
- [ ] `flatten`/`join`/`palette`/`instance`/`simplify`/`optimize` 프리셋을 쓰지 않았는가?
- [ ] 스킨드 메시(캐릭터류)에 `weld()`나 단독 `quantize()`를 쓰지 않았는가?
- [ ] 변환 후 `gltf-transform inspect`로 이름·애니메이션 클립 수/duration이 보존됐는지 확인했는가?
- [ ] KTX2 변환 전에 런타임 ORM으로 덮어써지는 죽은 텍스처를 먼저 제거했는가? 집합에 안 걸리는 노드(`eye_left`/`eye_right` 등)를 전수 확인했는가?
- [ ] normal map**과 ORM**을 ETC1S가 아니라 UASTC로 압축했는가?
- [ ] 변환 후 모든 texture가 `image/ktx2`인지 확인했는가? (실패가 warn으로만 남고 통과한다)
- [ ] transcoder/Draco 디코더를 `public/`에 self-host했는가? CDN을 참조하지 않는가?
- [ ] `KTX2Loader` 인스턴스가 하나이고 `detectSupport`가 최초 1회만 도는가? 두 번째 캔버스는 검증만 하는가?
- [ ] `useTexture` → `useKtx2Textures` 교체 후 UV 방향(`flipY`)과 `colorSpace`를 확인했는가?
- [ ] VRAM **바이트**를 전후 측정했는가(`info.memory`는 개수다)? Safari에서 확인했는가?
- [ ] 원본을 덮어쓰지 않고 `.vN` 접미사로 새 파일을 만들었는가? 참조하는 모든 경로를 갱신했는가?
