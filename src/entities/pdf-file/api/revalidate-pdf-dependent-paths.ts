import { revalidatePath } from 'next/cache';

import { EDITOR_LOCALES } from '@/entities/editor/model/editor-types';
import type { PdfFileKind } from '@/entities/pdf-file/model/types';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';

import 'server-only';

/**
 * PDF 업로드 결과에 의존하는 공개 경로를 다시 검증하게 만듭니다.
 */
export const revalidatePdfDependentPaths = (kind: PdfFileKind) => {
  EDITOR_LOCALES.forEach(locale => {
    revalidatePath(
      buildLocalizedPathname({
        locale,
        pathname: kind === 'resume' ? '/resume' : '/project',
      }),
    );
  });
};
