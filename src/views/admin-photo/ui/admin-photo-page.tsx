'use client';

import React from 'react';

import type { PhotoFileItem } from '@/entities/hero-photo/model/types';
import { Button } from '@/shared/ui/button/button';
import { AdminConsoleShell } from '@/widgets/admin-console';
import { AdminPhotoLibraryPanel } from '@/widgets/admin-photo-library';

type AdminPhotoPageProps = {
  initialItems: PhotoFileItem[];
  locale?: string;
};

/**
 * 관리자 사진 업로드/삭제 페이지를 렌더링합니다.
 */
export const AdminPhotoPage = ({ initialItems, locale }: AdminPhotoPageProps) => {
  const content = <AdminPhotoLibraryPanel initialItems={initialItems} />;
  const handleUploadTrigger = React.useCallback(() => {
    document.querySelector<HTMLInputElement>('input[aria-label="사진 파일 선택"]')?.click();
  }, []);

  if (!locale) {
    return content;
  }

  return (
    <AdminConsoleShell
      action={
        <Button onClick={handleUploadTrigger} tone="primary" variant="solid">
          사진 업로드
        </Button>
      }
      activeSection="photo"
      locale={locale}
      title="Photo"
    >
      {content}
    </AdminConsoleShell>
  );
};
