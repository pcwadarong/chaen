import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { createProjectCacheTag, PROJECTS_CACHE_TAG } from '@/entities/project/model/cache-tags';

/**
 * 프로젝트 캐시를 온디맨드로 무효화합니다.
 * `projectId`를 전달하면 단일 프로젝트 태그까지 함께 갱신합니다.
 */
export const POST = async (request: Request) => {
  const url = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const secretFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const secretFromQuery = url.searchParams.get('secret');
  const receivedSecret = secretFromHeader ?? secretFromQuery;

  if (!process.env.REVALIDATE_SECRET || receivedSecret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  let projectId: string | null = null;
  try {
    const body = (await request.json()) as { projectId?: unknown };
    if (typeof body.projectId === 'string' && body.projectId.trim()) {
      projectId = body.projectId.trim();
    }
  } catch {
    // body가 없거나 JSON이 아니면 전체 프로젝트 태그만 갱신합니다.
  }

  revalidateTag(PROJECTS_CACHE_TAG);
  if (projectId) revalidateTag(createProjectCacheTag(projectId));

  return NextResponse.json({
    ok: true,
    revalidated: projectId
      ? [PROJECTS_CACHE_TAG, createProjectCacheTag(projectId)]
      : [PROJECTS_CACHE_TAG],
  });
};
