import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { DeferredPdfDownloadPopover } from '@/shared/ui/pdf-download-popover/deferred-pdf-download-popover';

describe('DeferredPdfDownloadPopover', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    consoleErrorSpy.mockRestore();
  });

  it('초기에는 pending 버튼을 렌더링하고 이후 다운로드 옵션을 표시한다', async () => {
    let resolveFetch:
      | ((value: {
          json: () => Promise<
            Array<{
              assetKey: 'resume-ko';
              fileName: string;
              href: string;
              locale: 'ko';
            }>
          >;
          ok: true;
        }) => void)
      | null = null;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise(resolve => {
            resolveFetch = resolve;
          }),
      ),
    );

    await act(async () => {
      render(
        <DeferredPdfDownloadPopover
          kind="resume"
          label="이력서 다운로드"
          source="resume-page"
          unavailableLabel="준비 중"
        />,
      );
    });

    expect(screen.getByRole('button', { name: '이력서 다운로드' })).toHaveProperty(
      'disabled',
      true,
    );

    await act(async () => {
      resolveFetch?.({
        json: async () => [
          {
            assetKey: 'resume-ko',
            fileName: 'ParkChaewon-Resume-ko.pdf',
            href: '/api/pdf/file/resume-ko?source=resume-page',
            locale: 'ko',
          },
        ],
        ok: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '이력서 다운로드' })).toHaveProperty(
        'disabled',
        false,
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '이력서 다운로드' }));

    expect(
      (await screen.findByRole('link', { name: /KO ParkChaewon-Resume-ko\.pdf/ })).getAttribute(
        'href',
      ),
    ).toBe('/api/pdf/file/resume-ko?source=resume-page');
  });

  it('옵션 조회가 실패하면 unavailable 버튼으로 폴백한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failed')));

    await act(async () => {
      render(
        <DeferredPdfDownloadPopover
          kind="portfolio"
          label="포트폴리오 다운로드"
          source="project-page"
          unavailableLabel="포트폴리오 준비 중"
        />,
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '포트폴리오 준비 중' })).toHaveProperty(
        'disabled',
        true,
      );
    });
  });
});
