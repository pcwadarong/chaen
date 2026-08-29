#!/usr/bin/env node

/**
 * PR에 라인별 코멘트 추가 스크립트
 * Usage: node post-line-comment.mjs <file-path> <line> <body>
 *
 * Examples:
 *   node post-line-comment.mjs src/components/Button.tsx 42 "이 부분 널 체크가 필요해 보여요"
 */

import { getCurrentPR, postPRLineComment } from '../../_shared/github-api.mjs';

const FILE_PATH = process.argv[2];
const LINE = process.argv[3];
const BODY = process.argv[4];

if (!FILE_PATH || !LINE || !BODY) {
  console.error('Usage: node post-line-comment.mjs <file-path> <line> <body>');
  console.error('');
  console.error('Example:');
  console.error('  node post-line-comment.mjs src/components/Button.tsx 42 "널 체크 필요"');
  process.exit(1);
}

const lineNumber = parseInt(LINE, 10);
if (isNaN(lineNumber) || lineNumber <= 0) {
  console.error('Error: line은 양의 정수여야 합니다.');
  process.exit(1);
}

async function main() {
  // PR 정보
  const pr = await getCurrentPR();
  if (!pr) {
    console.error('❌ PR을 찾을 수 없습니다.');
    process.exit(1);
  }

  const formattedBody = `${BODY}

🤖 *Claude Code 셀프 리뷰*`;

  console.log(`💬 ${FILE_PATH}:${LINE}에 코멘트 작성 중...`);

  try {
    await postPRLineComment(pr.number, {
      path: FILE_PATH,
      line: lineNumber,
      body: formattedBody,
      commitId: pr.headRefOid,
    });

    console.log('✅ 코멘트 작성 완료');
  } catch (error) {
    console.error('❌ 코멘트 작성 실패:', error.message);
    console.error('   (해당 라인이 diff에 포함되어 있는지 확인해주세요)');
    process.exit(1);
  }
}

main();
