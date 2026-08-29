#!/usr/bin/env node

/**
 * PR의 변경사항(diff) 조회 스크립트
 * Usage: node get-pr-diff.mjs [pr-number]
 *
 * PR 번호를 생략하면 현재 브랜치의 PR을 자동으로 찾음
 */

import { getCurrentPR, getPRFiles, getPRDiff } from '../../_shared/github-api.mjs';

const PR_NUMBER = process.argv[2];

async function main() {
  let prNumber = PR_NUMBER ? parseInt(PR_NUMBER, 10) : null;

  if (!prNumber) {
    console.log('🔍 현재 브랜치의 PR 확인 중...');
    const pr = await getCurrentPR();

    if (!pr) {
      console.error('❌ PR을 찾을 수 없습니다.');
      console.error('   먼저 PR을 생성해주세요');
      process.exit(1);
    }

    prNumber = pr.number;
    console.log(`   PR #${prNumber}: ${pr.title}`);
    console.log(`   ${pr.baseRefName} ← ${pr.headRefName}`);
    console.log(`   URL: ${pr.url}`);
    console.log('');
  }

  console.log('📝 PR 변경사항 조회 중...\n');

  // 변경된 파일 목록
  const files = await getPRFiles(prNumber);

  console.log(`## 변경된 파일 (${files.length}개)\n`);
  for (const file of files) {
    console.log(`- ${file.path} (+${file.additions} -${file.deletions})`);
  }
  console.log('');

  // diff 가져오기
  console.log('## Diff\n');
  const diff = await getPRDiff(prNumber);

  if (diff) {
    // diff가 너무 길면 자르기
    if (diff.length > 50000) {
      console.log(diff.slice(0, 50000));
      console.log('\n... (diff가 너무 길어 일부만 표시)');
    } else {
      console.log(diff);
    }
  } else {
    console.log('diff를 가져올 수 없습니다.');
  }
}

main().catch((error) => {
  console.error('❌ 오류:', error.message);
  process.exit(1);
});
