// @ts-check
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const THREE_LIBS = resolve(ROOT, 'node_modules/three/examples/jsm/libs');
const OUT_DIR = resolve(ROOT, 'public/decoders');

/**
 * three 번들에 들어 있는 디코더를 그대로 자체 호스팅한다.
 * 외부 CDN(gstatic / jsdelivr)에 의존하지 않기 위한 것이고,
 * three 버전을 올린 뒤에는 이 스크립트를 다시 돌려 wasm/js 버전을 맞춰야 한다.
 */
const DECODERS = [
  { from: 'draco/gltf', to: 'draco' },
  { from: 'basis', to: 'basis' },
];

const run = () => {
  for (const { from, to } of DECODERS) {
    const srcDir = resolve(THREE_LIBS, from);
    const outDir = resolve(OUT_DIR, to);

    mkdirSync(outDir, { recursive: true });

    for (const file of readdirSync(srcDir)) {
      const srcPath = resolve(srcDir, file);

      if (!statSync(srcPath).isFile()) continue;
      // 인코더는 런타임에 쓰지 않는다.
      if (file.endsWith('.md') || file.includes('encoder')) continue;

      copyFileSync(srcPath, resolve(outDir, file));
      console.log(`public/decoders/${to}/${file}`);
    }
  }
};

run();
