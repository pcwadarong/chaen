import { DeferredPdfDownloadPopover } from '@/shared/ui/pdf-download-popover/deferred-pdf-download-popover';
import { PageHeader, PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';

/**
 * project 페이지 셸의 PDF 다운로드 브라우저 smoke를 검증하기 위한 locale fixture 페이지입니다.
 */
const ProjectDownloadPageTestRoute = () => (
  <PageShell>
    <PageHeader
      action={
        <DeferredPdfDownloadPopover
          kind="portfolio"
          label="포트폴리오 다운로드"
          source="project-page"
          unavailableLabel="포트폴리오 준비 중"
        />
      }
      description="프로젝트 소개 fixture description"
      title="Selected Projects"
    />
    <PageSection>
      <p>Playwright browser contracts for portfolio download.</p>
    </PageSection>
  </PageShell>
);

export default ProjectDownloadPageTestRoute;
