import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { PdfDownloadPopover } from '@/shared/ui/pdf-download-popover/pdf-download-popover';

describe('PdfDownloadPopover', () => {
  it('내려받을 수 있는 파일이 없으면 비활성 버튼으로 렌더링한다', () => {
    render(
      <PdfDownloadPopover
        label="이력서 다운로드"
        options={[
          {
            assetKey: 'resume-ko',
            fileName: 'ParkChaewon-Resume-kr.pdf',
            href: null,
            locale: 'ko',
          },
          {
            assetKey: 'resume-en',
            fileName: 'ParkChaewon-Resume-en.pdf',
            href: null,
            locale: 'en',
          },
        ]}
        unavailableLabel="이력서 준비 중"
      />,
    );

    expect(screen.getByRole('button', { name: '이력서 준비 중' })).toHaveProperty('disabled', true);
  });

  it('내려받을 수 있는 파일이 있으면 팝오버 안에 두 옵션을 함께 렌더링한다', () => {
    render(
      <PdfDownloadPopover
        label="이력서 다운로드"
        options={[
          {
            assetKey: 'resume-ko',
            fileName: 'ParkChaewon-Resume-kr.pdf',
            href: '/api/pdf/file/resume-ko',
            locale: 'ko',
          },
          {
            assetKey: 'resume-en',
            fileName: 'ParkChaewon-Resume-en.pdf',
            href: null,
            locale: 'en',
          },
        ]}
        unavailableLabel="이력서 준비 중"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '이력서 다운로드' }));

    expect(screen.getByRole('dialog', { name: '이력서 다운로드' })).toBeTruthy();

    const koLink = screen.getByRole('link', { name: /KO ParkChaewon-Resume-kr\.pdf/ });
    expect(koLink.getAttribute('href')).toBe('/api/pdf/file/resume-ko');
    expect(koLink.getAttribute('download')).toBe('ParkChaewon-Resume-kr.pdf');

    expect(screen.getByRole('button', { name: /EN ParkChaewon-Resume-en\.pdf/ })).toHaveProperty(
      'disabled',
      true,
    );
  });
});
