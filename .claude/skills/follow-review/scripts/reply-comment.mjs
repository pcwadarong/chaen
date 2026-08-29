#!/usr/bin/env node

/**
 * PR 코멘트에 답글 달기
 * Usage: node reply-comment.mjs <comment-id> <message>
 *
 * Examples:
 *   node reply-comment.mjs 12345678 "수정 완료했어요!"
 */

import { getCurrentPR, replyToPRComment } from '../../_shared/github-api.mjs';

const COMMENT_ID = process.argv[2];
const MESSAGE = process.argv[3];

if (!COMMENT_ID || !MESSAGE) {
  console.error('Usage: node reply-comment.mjs <comment-id> <message>');
  console.error('');
  console.error('Example:');
  console.error('  node reply-comment.mjs 12345678 "수정 완료했어요!"');
  process.exit(1);
}

const commentIdNumber = parseInt(COMMENT_ID, 10);
if (isNaN(commentIdNumber) || commentIdNumber <= 0) {
  console.error('Error: comment-id는 양의 정수여야 합니다.');
  process.exit(1);
}

async function main() {
  // PR 번호
  const pr = await getCurrentPR();
  if (!pr) {
    console.error('❌ PR을 찾을 수 없습니다.');
    process.exit(1);
  }

  // 메시지 포맷팅
  const formattedMessage = `${MESSAGE}

🤖 *Claude Code로 작성된 답글입니다*`;

  console.log(`💬 코멘트 #${COMMENT_ID}에 답글 작성 중...`);

  try {
    await replyToPRComment(pr.number, commentIdNumber, formattedMessage);
    console.log('✅ 답글 작성 완료');
  } catch (error) {
    console.error('❌ 답글 작성 실패:', error.message);
    process.exit(1);
  }
}

main();
