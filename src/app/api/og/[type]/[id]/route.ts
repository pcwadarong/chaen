import { NextResponse } from 'next/server';

import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { OG_API_ERROR_MESSAGE } from '@/shared/lib/seo/og-api-error';
import { buildDefaultOgImageUrl, isOgImageType } from '@/shared/lib/seo/og-image';

type OgImageRouteContext = {
  params: Promise<{
    id: string;
    type: string;
  }>;
};

/**
 * 현재 단계에서는 placeholder OG 이미지로 리다이렉트합니다.
 */
export const GET = async (_request: Request, { params }: OgImageRouteContext) => {
  const { type } = await params;
  if (!isOgImageType(type)) {
    return createApiErrorResponse(OG_API_ERROR_MESSAGE.notFound, 404);
  }

  return NextResponse.redirect(buildDefaultOgImageUrl());
};
