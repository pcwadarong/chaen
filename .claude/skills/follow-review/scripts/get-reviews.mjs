#!/usr/bin/env node

/**
 * PR의 CodeRabbit 리뷰 코멘트 조회 스크립트
 * Usage: node get-reviews.mjs [pr-number]
 *
 * PR 번호를 생략하면 현재 브랜치의 PR을 자동으로 찾음
 */

import {
  getCurrentPR,
  getPRReviewComments,
  getPRReviews,
} from '../../_shared/github-api.mjs';

const PR_NUMBER = process.argv[2];

async function main() {
  // PR 번호 확인
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
    console.log(`   URL: ${pr.url}`);
    console.log('');
  }

  console.log('📝 PR 리뷰 코멘트 조회 중...\n');

  // 리뷰 코멘트 (라인별 코멘트) - 모든 리뷰어
  const comments = await getPRReviewComments(prNumber);

  // 리뷰 (Summary) - 모든 리뷰어
  const reviews = await getPRReviews(prNumber);

  // 답글이 아닌 최상위 코멘트만 필터링
  const topLevelComments = comments.filter((c) => !c.inReplyToId);

  if (topLevelComments.length === 0 && reviews.length === 0) {
    console.log('리뷰 코멘트가 없습니다.');
    return;
  }

  // Summary 리뷰 출력
  const reviewsWithBody = reviews.filter((r) => r.body && r.body.trim());
  if (reviewsWithBody.length > 0) {
    console.log('## Summary Reviews\n');
    for (const review of reviewsWithBody) {
      console.log(`### @${review.user} - Review #${review.id} (${review.state})`);
      console.log(review.body.slice(0, 500) + (review.body.length > 500 ? '...' : ''));
      console.log('');
    }
  }

  // 라인별 코멘트 출력
  if (topLevelComments.length > 0) {
    console.log(`## Line Comments (${topLevelComments.length}개)\n`);

    // 파일별로 그룹핑
    const byFile = {};
    for (const comment of topLevelComments) {
      if (!byFile[comment.path]) {
        byFile[comment.path] = [];
      }
      byFile[comment.path].push(comment);
    }

    for (const [path, fileComments] of Object.entries(byFile)) {
      console.log(`### 📄 ${path}`);
      for (const comment of fileComments) {
        console.log(`\n**@${comment.user}** (Line ${comment.line || '?'}, ID: ${comment.id})`);
        // 코멘트 본문에서 핵심만 추출 (너무 길면 자르기)
        const body = comment.body.replace(/<!-- .* -->/gs, '').trim();
        const shortBody = body.length > 300 ? body.slice(0, 300) + '...' : body;
        console.log(shortBody);
      }
      console.log('');
    }
  }

  // JSON 출력 (다른 스크립트에서 사용)
  if (process.env.JSON_OUTPUT === 'true') {
    console.log('\n--- JSON ---');
    console.log(JSON.stringify({ comments: topLevelComments, reviews }, null, 2));
  }
}

main().catch((error) => {
  console.error('❌ 오류:', error.message);
  process.exit(1);
});
