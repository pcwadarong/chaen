import { NextResponse } from 'next/server';

import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import { isPdfFileKind } from '@/entities/pdf-file/model/types';

type PdfFileRouteContext = {
  params: Promise<{
    kind: string;
  }>;
};

/**
 * 내부 PDF 다운로드 경로를 signed URL로 위임합니다.
 */
export const GET = async (_request: Request, { params }: PdfFileRouteContext) => {
  const { kind } = await params;
  if (!isPdfFileKind(kind)) {
    return NextResponse.json({ message: 'Not Found' }, { status: 404 });
  }

  const signedUrl = await getPdfFileUrl({
    accessType: 'signed',
    kind,
  });

  if (!signedUrl) {
    return NextResponse.json({ message: 'Not Found' }, { status: 404 });
  }

  return NextResponse.redirect(signedUrl);
};
