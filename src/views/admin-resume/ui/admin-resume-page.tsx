import React from 'react';
import { css } from 'styled-system/css';

import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import { AdminConsoleShell } from '@/widgets/admin-console';
import type { AdminPdfUploadItem } from '@/widgets/admin-pdf-upload';
import { AdminPdfUploadPanel } from '@/widgets/admin-pdf-upload';

type AdminResumePageProps = {
  pdfUploadItems: AdminPdfUploadItem[];
  signOutRedirectPath?: string;
};

/**
 * 관리자 resume 작업 허브를 렌더링합니다.
 * resume 본문 편집 진입과 PDF 파일 관리를 한 화면에 모읍니다.
 */
export const AdminResumePage = ({
  pdfUploadItems,
  signOutRedirectPath = '/ko/admin/login',
}: AdminResumePageProps) => (
  <AdminConsoleShell
    action={
      <div className={actionClass}>
        <Button asChild tone="white" variant="solid">
          <Link href="/admin/resume/edit">이력서 편집</Link>
        </Button>
      </div>
    }
    activeSection="resume"
    signOutRedirectPath={signOutRedirectPath}
    title="Resume"
  >
    <AdminPdfUploadPanel initialItems={pdfUploadItems} />
  </AdminConsoleShell>
);

const actionClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: '3',
});
