import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const NODE_ENV_MARKER = '@vitest-environment node';
const DOM_UI_CHUNK_SIZE = 6;

const HEAVY_TEST_FILES = [
  'src/widgets/editor/ui/core/editor-core.test.tsx',
  'src/features/edit-markdown/ui/markdown-toolbar.test.tsx',
  'src/views/articles/ui/article-detail-page.test.tsx',
  'src/views/project/ui/project-detail-page.test.tsx',
  'src/widgets/editor/ui/publish/publish-panel.test.tsx',
  'src/shared/ui/image-viewer/image-viewer-modal.test.tsx',
  'src/views/resume-editor/ui/resume-editor-client.test.tsx',
];

/**
 * 저장소에서 전체 테스트 파일 목록을 읽어 상대 경로 배열로 반환합니다.
 *
 * @returns 현재 저장소의 `*.test.ts`, `*.test.tsx` 파일 목록입니다.
 */
const getAllTestFiles = () => {
  const srcFiles = execFileSync('rg', ['--files', 'src'], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter(filePath => filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx'));

  return fs.existsSync('middleware.test.ts') ? [...srcFiles, 'middleware.test.ts'] : srcFiles;
};

/**
 * 파일 상단 주석을 읽어 `node` 환경 테스트인지 판별합니다.
 *
 * @param filePath 테스트 파일 상대 경로입니다.
 * @returns `@vitest-environment node`가 있으면 true를 반환합니다.
 */
const isNodeEnvironmentTest = filePath =>
  fs.readFileSync(path.resolve(filePath), 'utf8').includes(NODE_ENV_MARKER);

/**
 * 파일 배열을 고정 크기의 청크로 나눕니다.
 *
 * @param files 나눌 파일 배열입니다.
 * @param chunkSize 각 청크의 최대 크기입니다.
 * @returns 각 청크의 파일 배열입니다.
 */
const splitIntoChunks = (files, chunkSize) => {
  const chunks = [];

  for (let index = 0; index < files.length; index += chunkSize) {
    chunks.push(files.slice(index, index + chunkSize));
  }

  return chunks;
};

/**
 * 그룹 이름에 맞는 테스트 파일 집합과 worker 수를 계산합니다.
 *
 * @param group 실행할 테스트 그룹 이름입니다.
 * @returns 대상 파일 목록과 worker 수를 반환합니다.
 */
const resolveTestGroup = group => {
  const allFiles = getAllTestFiles();
  const nodeFiles = allFiles.filter(isNodeEnvironmentTest);
  const heavyFiles = HEAVY_TEST_FILES.filter(filePath => allFiles.includes(filePath));
  const excludedForLight = new Set([...nodeFiles, ...heavyFiles]);
  const domLightFiles = allFiles.filter(filePath => !excludedForLight.has(filePath));
  const domModelFiles = domLightFiles.filter(filePath => filePath.endsWith('.test.ts'));
  const domUiFiles = domLightFiles.filter(filePath => filePath.endsWith('.test.tsx'));
  const domUiChunks = splitIntoChunks(domUiFiles, DOM_UI_CHUNK_SIZE);

  switch (group) {
    case 'node':
      return {
        files: nodeFiles,
        maxWorkers: '2',
      };
    case 'dom-model':
      return {
        files: domModelFiles,
        maxWorkers: '4',
      };
    case 'dom-ui':
      return {
        files: domUiFiles,
        chunks: domUiChunks,
        maxWorkers: '2',
      };
    default:
      if (group.startsWith('dom-ui:')) {
        const chunkIndex = Number(group.split(':')[1]) - 1;

        return {
          files: domUiChunks[chunkIndex] ?? [],
          maxWorkers: '2',
        };
      }

      if (group === 'dom-heavy') {
        return {
          files: heavyFiles,
          maxWorkers: '2',
        };
      }

      if (group === 'list') {
        return {
          files: allFiles,
          maxWorkers: '1',
          summary: {
            'dom-heavy': heavyFiles.length,
            'dom-model': domModelFiles.length,
            'dom-ui': domUiFiles.length,
            'dom-ui:chunks': domUiChunks.length,
            'dom-ui:chunk-size': DOM_UI_CHUNK_SIZE,
            node: nodeFiles.length,
            total: allFiles.length,
          },
        };
      }

      throw new Error(`알 수 없는 테스트 그룹입니다: ${group}`);
  }
};

/**
 * 파일 집합에 해당하는 Vitest 실행 명령을 현재 프로세스와 연결해 실행합니다.
 *
 * @param files 실행할 테스트 파일 목록입니다.
 * @param maxWorkers worker 수입니다.
 */
const runVitest = (files, maxWorkers) =>
  new Promise(resolve => {
    const child = spawn('pnpm', ['vitest', 'run', ...files, `--maxWorkers=${maxWorkers}`], {
      stdio: 'inherit',
    });

    child.on('exit', code => {
      resolve(code ?? 1);
    });
  });

/**
 * 그룹에 해당하는 Vitest 실행 명령을 현재 프로세스와 연결해 실행합니다.
 *
 * @param group 실행할 테스트 그룹 이름입니다.
 */
const runVitestGroup = async group => {
  const resolved = resolveTestGroup(group);

  if (group === 'list') {
    console.log(JSON.stringify(resolved.summary, null, 2));
    return;
  }

  if (resolved.files.length === 0) {
    console.log(`[run-vitest-group] '${group}' 그룹에는 실행할 테스트가 없습니다.`);
    return;
  }

  if (group === 'dom-ui') {
    for (const [index, chunk] of resolved.chunks.entries()) {
      console.log(
        `[run-vitest-group] dom-ui chunk ${index + 1}/${resolved.chunks.length} (${chunk.length} files)`,
      );
      const code = await runVitest(chunk, resolved.maxWorkers);

      if (code !== 0) {
        process.exit(code);
      }
    }

    return;
  }

  const code = await runVitest(resolved.files, resolved.maxWorkers);
  process.exit(code);
};

runVitestGroup(process.argv[2] ?? 'list');
