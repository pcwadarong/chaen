import { css } from 'styled-system/css';

import { DeferredPdfDownloadPopover } from '@/shared/ui/pdf-download-popover/deferred-pdf-download-popover';

/**
 * DeferredPdfDownloadPopover의 브라우저 fetch/interaction 계약을 검증하기 위한 fixture입니다.
 */
export const DeferredPdfDownloadPopoverE2eFixture = () => (
  <main className={pageClass}>
    <section className={sectionClass}>
      <h1 className={titleClass}>Deferred PDF Download Popover Fixture</h1>
      <p className={descriptionClass}>
        hydration 이후 PDF 옵션을 조회해 준비되면 다운로드 팝오버를 열고, 실패하면 unavailable
        버튼으로 폴백하는지 검증한다.
      </p>
    </section>

    <section className={sectionClass}>
      <h2 className={sectionTitleClass}>Resume Download</h2>
      <DeferredPdfDownloadPopover
        kind="resume"
        label="이력서 다운로드"
        source="resume-page"
        unavailableLabel="이력서 준비 중"
      />
    </section>

    <section className={sectionClass}>
      <h2 className={sectionTitleClass}>Portfolio Download</h2>
      <DeferredPdfDownloadPopover
        kind="portfolio"
        label="포트폴리오 다운로드"
        source="project-page"
        unavailableLabel="포트폴리오 준비 중"
      />
    </section>
  </main>
);

const pageClass = css({
  minHeight: 'svh',
  display: 'grid',
  alignContent: 'start',
  gap: '6',
  px: '4',
  py: '6',
  background:
    '[linear-gradient(180deg, color-mix(in srgb, #5d5bff 10%, white) 0%, color-mix(in srgb, #5d5bff 2%, white) 100%)]',
});

const sectionClass = css({
  display: 'grid',
  gap: '3',
  maxWidth: '[44rem]',
  p: '5',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderColor: 'border',
  background: 'surface',
  justifyItems: 'start',
});

const titleClass = css({
  fontSize: '[clamp(2rem, 5vw, 3rem)]',
  lineHeight: 'none',
  letterSpacing: '[-0.04em]',
  fontWeight: 'semibold',
});

const descriptionClass = css({
  fontSize: 'md',
  color: 'muted',
});

const sectionTitleClass = css({
  fontSize: 'xl',
  fontWeight: 'semibold',
});
