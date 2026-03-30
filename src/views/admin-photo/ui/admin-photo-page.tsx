'use client';

import React from 'react';

import type { PhotoFileItem } from '@/entities/hero-photo/model/types';
import { Button } from '@/shared/ui/button/button';
import { AdminConsoleShell } from '@/widgets/admin-console';
import { AdminPhotoLibraryPanel } from '@/widgets/admin-photo-library';

type AdminPhotoPageProps = {
  initialItems: PhotoFileItem[];
  signOutRedirectPath?: string;
};

/**
 * 관리자 사진 업로드/삭제 페이지를 렌더링합니다.
 */
export const AdminPhotoPage = ({ initialItems, signOutRedirectPath }: AdminPhotoPageProps) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const content = (
    <AdminPhotoLibraryPanel fileInputRef={fileInputRef} initialItems={initialItems} />
  );
  const handleUploadTrigger = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (!signOutRedirectPath) {
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
      signOutRedirectPath={signOutRedirectPath}
      title="Photo"
    >
      {content}
    </AdminConsoleShell>
  );
};
