import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';

const CODE_FILE_PATTERN = /\.(cjs|cts|js|jsx|mjs|mts|ts|tsx)$/;
const PLAYWRIGHT_SPEC_PATTERN = /^tests\/browser\/.+\.spec\.ts$/;
const VITEST_TEST_FILE_PATTERN =
  /(^|\/)(middleware\.test\.ts|.+\.test\.(cjs|cts|js|jsx|mjs|mts|ts|tsx))$/;

/**
 * Vitest 관련도 계산에 포함할 수 있는 제품 코드 경로인지 확인합니다.
 *
 * @param filePath staged 파일 상대 경로입니다.
 * @returns Vitest가 직접 해석할 제품 코드면 true를 반환합니다.
 */
const isVitestRelatedSourceFile = filePath =>
  filePath.startsWith('src/') || filePath === 'middleware.ts' || filePath === 'middleware.test.ts';

/**
 * 현재 index에 올라간 파일 목록을 반환합니다.
 *
 * @returns staged 파일 상대 경로 배열입니다.
 */
const getStagedFiles = () => {
  const output = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    encoding: 'utf8',
  });

  return output
    .split('\n')
    .map(filePath => filePath.trim())
    .filter(Boolean);
};

/**
 * 주어진 디렉터리에서 co-located Vitest 파일 목록을 찾습니다.
 *
 * @param directoryPath 검색할 상대 디렉터리 경로입니다.
 * @returns 디렉터리 내부의 test 파일 상대 경로 배열입니다.
 */
const findVitestFilesInDirectory = directoryPath => {
  try {
    const output = execFileSync(
      'rg',
      [
        '--files',
        directoryPath,
        '-g',
        '*.test.ts',
        '-g',
        '*.test.tsx',
        '-g',
        '*.test.js',
        '-g',
        '*.test.jsx',
        '-g',
        '*.test.mts',
        '-g',
        '*.test.cts',
        '-g',
        '*.test.mjs',
        '-g',
        '*.test.cjs',
      ],
      {
        encoding: 'utf8',
      },
    );

    return output
      .split('\n')
      .map(filePath => filePath.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

/**
 * staged 변경에서 직접 실행할 Vitest 파일 목록을 계산합니다.
 *
 * `vitest related`는 현재 저장소의 SVG alias 해석과 충돌하므로,
 * pre-commit에서는 staged test 파일과 변경된 소스 파일 옆의 co-located test만 빠르게 실행합니다.
 *
 * @param files staged 파일 배열입니다.
 * @returns `vitest run`에 전달할 test 파일 배열입니다.
 */
const resolveVitestRunTargets = files => {
  const targets = new Set();

  files.forEach(filePath => {
    if (!CODE_FILE_PATTERN.test(filePath) || PLAYWRIGHT_SPEC_PATTERN.test(filePath)) {
      return;
    }

    if (VITEST_TEST_FILE_PATTERN.test(filePath)) {
      targets.add(filePath);
      return;
    }

    if (!isVitestRelatedSourceFile(filePath)) {
      return;
    }

    const directoryPath = path.dirname(filePath);

    findVitestFilesInDirectory(directoryPath).forEach(testFilePath => {
      targets.add(testFilePath);
    });
  });

  return Array.from(targets);
};

/**
 * 현재 staged 변경에 Playwright spec가 포함되어 있는지 확인합니다.
 *
 * @param files staged 파일 배열입니다.
 * @returns browser spec가 있으면 true를 반환합니다.
 */
const hasPlaywrightSpecChanges = files =>
  files.some(filePath => PLAYWRIGHT_SPEC_PATTERN.test(filePath));

/**
 * staged 대상에 대한 빠른 Vitest 관련 테스트를 실행합니다.
 *
 * 전체 회귀 대신 변경된 코드와 직접 연결된 테스트만 확인해
 * pre-commit 피드백 시간을 짧게 유지합니다.
 */
const run = async () => {
  const stagedFiles = getStagedFiles();
  const vitestTargets = resolveVitestRunTargets(stagedFiles);

  if (vitestTargets.length === 0) {
    if (hasPlaywrightSpecChanges(stagedFiles)) {
      console.log(
        '[run-staged-tests] browser spec 변경은 pre-push smoke 및 CI에서 검증합니다. 이번 pre-commit에서는 Vitest 대상이 없습니다.',
      );
      return;
    }

    console.log('[run-staged-tests] 실행할 staged 테스트 대상이 없습니다.');
    return;
  }

  await new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['exec', 'vitest', 'run', '--passWithNoTests', ...vitestTargets], {
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`staged tests failed with code ${code ?? 1}`));
    });
  });
};

run().catch(error => {
  console.error('[run-staged-tests] staged 테스트 실행 중 오류가 발생했습니다.');
  console.error(error);
  process.exit(1);
});
