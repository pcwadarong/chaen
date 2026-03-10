import { NextResponse } from 'next/server';

import { isOgImageType, OG_IMAGE_PLACEHOLDER_URL } from '@/shared/lib/seo/og-image';

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
    return NextResponse.json({ message: 'Not Found' }, { status: 404 });
  }

  return NextResponse.redirect(OG_IMAGE_PLACEHOLDER_URL);
};
