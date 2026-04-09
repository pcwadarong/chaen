import { DeferredPdfDownloadPopover } from '@/shared/ui/pdf-download-popover/deferred-pdf-download-popover';
import { PageHeader, PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';

/**
 * resume 페이지 셸의 PDF 다운로드 브라우저 smoke를 검증하기 위한 locale fixture 페이지입니다.
 */
const ResumeDownloadPageTestRoute = () => (
  <PageShell width="compact">
    <PageHeader
      action={
        <DeferredPdfDownloadPopover
          kind="resume"
          label="이력서 다운로드"
          source="resume-page"
          unavailableLabel="이력서 준비 중"
        />
      }
      description="이력서 소개 fixture description"
      title="박채원 이력서"
    />
    <PageSection>
      <p>Playwright browser contracts for resume download.</p>
    </PageSection>
  </PageShell>
);

export default ResumeDownloadPageTestRoute;
