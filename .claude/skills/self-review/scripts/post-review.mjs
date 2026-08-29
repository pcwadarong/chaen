#!/usr/bin/env node

/**
 * PR에 리뷰 제출 스크립트
 * Usage: node post-review.mjs <event> <body>
 *
 * event: COMMENT, APPROVE, REQUEST_CHANGES
 * body: 리뷰 본문 (파일 경로로 전달 가능)
 *
 * Examples:
 *   node post-review.mjs COMMENT "전반적으로 좋아 보여요!"
 *   node post-review.mjs COMMENT @review-body.md
 */

import { readFileSync, existsSync } from 'fs';
import { getCurrentPR, submitPRReview } from '../../_shared/github-api.mjs';

const EVENT = process.argv[2];
const BODY_ARG = process.argv[3];

if (!EVENT || !BODY_ARG) {
  console.error('Usage: node post-review.mjs <event> <body>');
  console.error('');
  console.error('event: COMMENT, APPROVE, REQUEST_CHANGES');
  console.error('body: 리뷰 본문 또는 @파일경로');
  console.error('');
  console.error('Examples:');
  console.error('  node post-review.mjs COMMENT "전반적으로 좋아 보여요!"');
  console.error('  node post-review.mjs COMMENT @review-body.md');
  process.exit(1);
}

const VALID_EVENTS = ['COMMENT', 'APPROVE', 'REQUEST_CHANGES'];
if (!VALID_EVENTS.includes(EVENT)) {
  console.error(`❌ 유효하지 않은 event: ${EVENT}`);
  console.error(`   가능한 값: ${VALID_EVENTS.join(', ')}`);
  process.exit(1);
}

async function main() {
  // body 처리 (파일 또는 직접 텍스트)
  let body = BODY_ARG;
  if (BODY_ARG.startsWith('@')) {
    const filePath = BODY_ARG.slice(1);
    if (!existsSync(filePath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
      process.exit(1);
    }
    body = readFileSync(filePath, 'utf-8');
  }

  // 리뷰 본문에 서명 추가
  const formattedBody = `${body}

---
🤖 *Claude Code 셀프 리뷰*`;

  // PR 정보 가져오기
  const pr = await getCurrentPR();
  if (!pr) {
    console.error('❌ PR을 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`💬 PR #${pr.number}에 리뷰 제출 중... (${EVENT})`);

  try {
    await submitPRReview(pr.number, {
      event: EVENT,
      body: formattedBody,
    });

    console.log('✅ 리뷰 제출 완료');
  } catch (error) {
    console.error('❌ 리뷰 제출 실패:', error.message);
    process.exit(1);
  }
}

main();
