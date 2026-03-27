import React from 'react';

import type { PhotoFileItem } from '@/entities/hero-photo/model/types';
import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import { AdminPhotoLibraryPanel } from '@/widgets/admin-photo-library';
import { PageHeader, PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';

type AdminPhotoPageProps = {
  initialItems: PhotoFileItem[];
  locale: string;
};

/**
 * 관리자 사진 업로드/삭제 페이지를 렌더링합니다.
 */
export const AdminPhotoPage = ({ initialItems }: AdminPhotoPageProps) => (
  <PageShell width="default" hideAppFrameFooter>
    <PageHeader
      action={
        <Button asChild tone="white" variant="solid">
          <Link href="/admin">관리자 홈으로</Link>
        </Button>
      }
      description="다른 페이지 이미지 뷰어에서 사용할 사진을 업로드 순서대로 정리합니다."
      title="사진 관리"
    />
    <PageSection>
      <AdminPhotoLibraryPanel initialItems={initialItems} />
    </PageSection>
  </PageShell>
);
