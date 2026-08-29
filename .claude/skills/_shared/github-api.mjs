/**
 * PR 스킬들이 공유하는 GitHub 접근 계층.
 *
 * jobs-client 에서 가져온 스킬 스크립트들이 이 모듈을 import 하는데 파일 자체가 안 넘어와서
 * 전부 ERR_MODULE_NOT_FOUND 로 죽고 있었다. 그래서 여기서 새로 만든다.
 *
 * Octokit + GITHUB_TOKEN 대신 `gh` CLI 를 쓴다.
 *   - 이 레포는 개인 레포 하나뿐이라 토큰을 따로 발급/보관할 이유가 없다
 *   - `gh auth` 인증을 그대로 물려받으므로 .env 에 비밀이 하나 덜 생긴다
 *   - 의존성 3개(@octokit/rest, chalk, inquirer)를 안 깔아도 된다
 *
 * `gh api` 는 경로의 {owner}/{repo} 를 현재 레포로 자동 치환한다.
 *
 * ⚠️ chaen 고유: 셸에 회사 계정(chole_karrot)의 GITHUB_TOKEN 이 설정돼 있고 gh 가 그걸
 *    우선 사용한다. 그대로 두면 **조용히 회사 계정으로 코멘트가 달린다.** 그래서 모든
 *    호출에서 GITHUB_TOKEN 을 지워 keyring 의 개인 계정(pcwadarong) 인증을 쓰게 한다.
 */

import { execFileSync } from 'node:child_process';

/** 코멘트/리뷰 조회 상한. 1인 레포에서 한 PR 이 이걸 넘길 일은 없다. */
const PER_PAGE = 100;

function gh(args, { input } = {}) {
  try {
    // GITHUB_TOKEN 을 지운 환경으로 실행 — 위 주석의 계정 오염 방지.
    const { GITHUB_TOKEN: _ignored, ...env } = process.env;

    return execFileSync('gh', args, {
      encoding: 'utf8',
      env,
      input,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    // gh 는 실패 사유를 stderr 에 쓴다. 그걸 삼키면 원인 파악이 불가능해진다.
    const detail = (error.stderr || '').toString().trim();
    throw new Error(detail || error.message);
  }
}

function ghJson(args, { input } = {}) {
  const out = gh(args, { input }).trim();

  return out ? JSON.parse(out) : null;
}

/** POST 본문은 길고 개행·따옴표가 섞이므로 -f 플래그 대신 stdin JSON 으로 넘긴다. */
function ghPost(endpoint, payload) {
  return ghJson(['api', endpoint, '--method', 'POST', '--input', '-'], {
    input: JSON.stringify(payload),
  });
}

/**
 * 현재 브랜치의 열린 PR. 없으면 null.
 * @returns {Promise<{number:number,title:string,url:string,baseRefName:string,headRefName:string,headRefOid:string}|null>}
 */
export async function getCurrentPR() {
  try {
    return ghJson([
      'pr',
      'view',
      '--json',
      'number,title,url,baseRefName,headRefName,headRefOid',
    ]);
  } catch {
    // PR 이 없을 때도 gh 는 non-zero 로 끝난다. 여기선 "없음"이 정상 경로다.
    return null;
  }
}

/** @returns {Promise<Array<{path:string,additions:number,deletions:number}>>} */
export async function getPRFiles(prNumber) {
  const { files } = ghJson(['pr', 'view', String(prNumber), '--json', 'files']) ?? {};

  return files ?? [];
}

/** @returns {Promise<string>} unified diff */
export async function getPRDiff(prNumber) {
  return gh(['pr', 'diff', String(prNumber)]);
}

/** 라인별 리뷰 코멘트 전부 (답글 포함 — 걸러내는 건 호출부 몫) */
export async function getPRReviewComments(prNumber) {
  const raw =
    ghJson(['api', `repos/{owner}/{repo}/pulls/${prNumber}/comments?per_page=${PER_PAGE}`]) ?? [];

  return raw.map((c) => ({
    id: c.id,
    user: c.user?.login ?? 'unknown',
    path: c.path,
    // 삭제된 줄이나 outdated 코멘트는 line 이 null 이라 original_line 으로 떨어진다.
    line: c.line ?? c.original_line ?? null,
    body: c.body ?? '',
    inReplyToId: c.in_reply_to_id ?? null,
    url: c.html_url,
  }));
}

/** Summary 리뷰 (APPROVED / CHANGES_REQUESTED / COMMENTED) */
export async function getPRReviews(prNumber) {
  const raw =
    ghJson(['api', `repos/{owner}/{repo}/pulls/${prNumber}/reviews?per_page=${PER_PAGE}`]) ?? [];

  return raw.map((r) => ({
    id: r.id,
    user: r.user?.login ?? 'unknown',
    state: r.state,
    body: r.body ?? '',
    url: r.html_url,
  }));
}

/**
 * 특정 파일·라인에 코멘트. 해당 라인이 diff 에 없으면 422 로 실패한다.
 * @param {{path:string,line:number,body:string,commitId:string}} comment
 */
export async function postPRLineComment(prNumber, { path, line, body, commitId }) {
  return ghPost(`repos/{owner}/{repo}/pulls/${prNumber}/comments`, {
    path,
    line,
    body,
    commit_id: commitId,
    side: 'RIGHT',
  });
}

/** @param {{event:'COMMENT'|'APPROVE'|'REQUEST_CHANGES',body:string}} review */
export async function submitPRReview(prNumber, { event, body }) {
  return ghPost(`repos/{owner}/{repo}/pulls/${prNumber}/reviews`, { event, body });
}

/** 라인 코멘트 스레드에 답글 */
export async function replyToPRComment(prNumber, commentId, body) {
  return ghPost(`repos/{owner}/{repo}/pulls/${prNumber}/comments/${commentId}/replies`, { body });
}
