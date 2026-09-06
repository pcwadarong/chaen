# 계측 캡처 워크플로 — GPU 브라우저 HUD 오버레이

성능·렌더링·타이밍 버그의 **전/후를 실측 스크린샷**으로 만드는 절차. 실제 홈 화면 위에 계측 HUD를 얹어 찍으므로, 프로파일러 스샷보다 읽기 쉽고 아티클 before/after 쌍에 바로 쓸 수 있다.

> **함정 — headless로 찍지 마라.** 소프트웨어 렌더링은 ≈4fps라 프레임레이트가 뭉개지고, `MIXER_MAX_DELTA_SECONDS`(≤1/30) 같은 상한에 걸려 전/후가 구분되지 않는다. **GPU 활성 브라우저**(paseo `browser_*` = 로컬 Chrome)에서 찍는다. 회/초 수치는 디스플레이 주사율만큼 나온다(60 또는 120Hz).

## 1. before/after 소스 준비

버그 버전과 수정 버전을 각각 빌드해야 한다. 커밋 히스토리를 이용한다.

```bash
# before(버그) = 수정 이전 커밋. 해당 파일만 되돌린다
git checkout main -- src/shared/lib/three/use-render-when-visible.ts src/widgets/.../*.tsx
# ... 계측 주입 후 빌드/촬영 ...
# after(수정) = 복원
git checkout HEAD -- <같은 파일들>
```

## 2. 계측 주입 (임시, 촬영 후 반드시 제거)

**캔버스별 useFrame 호출 수** — 매 프레임 콜백에 카운터를 심는다.

```ts
useFrame((_, delta) => {
  // __CAPTURE__ (제거 예정)
  if (typeof window !== 'undefined') {
    const w = window as unknown as { __frameCounts?: Record<string, number> };
    (w.__frameCounts ??= {})[instance] = (w.__frameCounts![instance] ?? 0) + 1;
  }
  mixer.update(Math.min(delta, MIXER_MAX_DELTA_SECONDS));
});
```

**상태 폴링용 getter** — R3F store를 캔버스 폭으로 태그해 노출(frameloop 뒤집힘 추적용).

```ts
const get = useThree(state => state.get); // R3F rootState.get = 라이브 getState
// effect 안에서:
const tag = Math.round(canvasElement.getBoundingClientRect().width);
(window as any).__r3fGet = { ...(window as any).__r3fGet, [tag]: get };
```

> Prettier가 빌드 시 걸리므로 객체 리터럴은 여러 줄로 쓴다. `next build`는 lint를 돌린다.

## 3. 프로덕션 빌드 + 서버

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3100 pnpm run build   # 파이프(| tail)로 exit code 가리지 말 것
NEXT_PUBLIC_SITE_URL=http://localhost:3100 pnpm exec next start -p 3100 &
until curl -s -o /dev/null http://localhost:3100/ko; do sleep 0.5; done
```

- 워크트리에 `node_modules`가 없으면 `pnpm install --frozen-lockfile` 먼저.
- `.env`는 읽기 차단될 수 있다 — 빌드는 `NEXT_PUBLIC_SITE_URL`만 인라인으로 주면 통과한다.

## 4. GPU 브라우저 + HUD + 스크린샷

paseo `browser_*` 도구로 실제 Chrome을 몬다.

```
browser_new_tab http://localhost:3100/ko
browser_resize  1600 x 1100          # 데스크탑 폭(두 캔버스 다 마운트)
browser_evaluate: (아래) 측정 → HUD 주입
browser_screenshot                    # 뷰포트(씬+HUD) 캡처
```

측정·HUD 주입 `browser_evaluate` 골자:

```js
async () => {
  const sr = document.querySelector('[data-app-scroll-viewport="true"]');
  // 재현: 노출 -> 다시 화면 밖 (버그 시나리오)
  sr.scrollTop = sr.scrollHeight;
  await new Promise(r => setTimeout(r, 700));
  sr.scrollTop = 0;
  await new Promise(r => setTimeout(r, 800));
  // 1초 실측
  window.__frameCounts = {};
  const t0 = performance.now();
  await new Promise(r => setTimeout(r, 1000));
  const dt = (performance.now() - t0) / 1000,
    c = window.__frameCounts;
  const contact = Math.round((c.contact ?? 0) / dt),
    hero = Math.round((c.main ?? 0) / dt);
  // 고정 위치 다크 카드 HUD 주입 (여백 넉넉한 좌상단 권장 — 우측은 잘리기 쉬움)
  const el = document.createElement('div');
  el.id = '__hud';
  el.innerHTML = `...contact ${contact}회/초 / hero ${hero}회/초...`;
  Object.assign(el.style, {
    position: 'fixed',
    top: '40px',
    left: '40px',
    zIndex: '99999',
    background: '#0f172a',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '14px',
    padding: '18px',
    width: '380px',
    font: '600 13px/1.4 ui-monospace,monospace',
  });
  document.body.appendChild(el);
  return { contact, hero };
};
```

HUD 디자인 팁:

- **좌상단(`left:40`) 배치** — 우상단은 네비/스크롤바에 카드가 잘린다.
- 카드 세로 스택, 폭 360~440px. `float` 대신 블록으로 — 넘쳐서 잘린다.
- BEFORE는 빨강(#ef4444), AFTER는 초록(#22c55e) 배지로 대비.
- **타임라인 트레이스**(never→always 뒤집힘)는 점·세로선으로 순서를 그리고 "그 사이 호출 0회"를 노랑으로 강조.

## 5. 정리 (필수)

```bash
git checkout HEAD -- <계측 주입한 파일 전부>
grep -rn "__CAPTURE__\|__frameCounts\|__r3fGet\|__rwvLog" src   # 잔여 0 확인
lsof -ti tcp:3100 | xargs kill
```

스크린샷은 대화에 렌더된다 — 사용자가 저장해 블로그에 넣는다. 파일로 디스크에 자동 저장되지는 않는다.
