import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';

import { AdminPdfUploadPanel } from '@/widgets/admin-pdf-upload/ui/admin-pdf-upload-panel';

vi.mock('@/entities/pdf-file/api/upload-pdf-file-by-asset-key', () => ({
  uploadPdfFileByAssetKey: vi.fn(),
}));

const baseItems = [
  {
    assetKey: 'resume-ko' as const,
    downloadFileName: '박채원_이력서.pdf',
    downloadPath: '/api/pdf/file/resume-ko',
    filePath: '박채원_이력서.pdf',
    isPdfReady: false,
    title: '이력서 PDF · 국문',
  },
  {
    assetKey: 'resume-en' as const,
    downloadFileName: 'ParkChaewon-Resume.pdf',
    downloadPath: '/api/pdf/file/resume-en',
    filePath: 'ParkChaewon-Resume.pdf',
    isPdfReady: false,
    title: '이력서 PDF · 영문',
  },
  {
    assetKey: 'portfolio-ko' as const,
    downloadFileName: '박채원_포트폴리오.pdf',
    downloadPath: '/api/pdf/file/portfolio-ko',
    filePath: '박채원_포트폴리오.pdf',
    isPdfReady: false,
    title: '포트폴리오 PDF · 국문',
  },
  {
    assetKey: 'portfolio-en' as const,
    downloadFileName: 'ParkChaewon-Portfolio.pdf',
    downloadPath: '/api/pdf/file/portfolio-en',
    filePath: 'ParkChaewon-Portfolio.pdf',
    isPdfReady: true,
    title: '포트폴리오 PDF · 영문',
  },
];

describe('AdminPdfUploadPanel', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('4개 고정 파일명과 현재 업로드 상태를 함께 보여준다', () => {
    render(<AdminPdfUploadPanel initialItems={baseItems} />);

    expect(screen.getByRole('heading', { level: 2, name: 'PDF 파일 관리' })).toBeTruthy();
    expect(screen.getByText('박채원_이력서.pdf')).toBeTruthy();
    expect(screen.getByText('ParkChaewon-Resume.pdf')).toBeTruthy();
    expect(screen.getByText('박채원_포트폴리오.pdf')).toBeTruthy();
    expect(screen.getByText('ParkChaewon-Portfolio.pdf')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: '다운로드 확인' })).toHaveLength(3);
    expect(screen.getByRole('link', { name: '다운로드 확인' })).toBeTruthy();
  });

  it('국문 이력서 PDF 업로드 성공 시 카드 상태를 최신 결과로 갱신한다', async () => {
    const { uploadPdfFileByAssetKey } =
      await import('@/entities/pdf-file/api/upload-pdf-file-by-asset-key');

    vi.mocked(uploadPdfFileByAssetKey).mockResolvedValue({
      assetKey: 'resume-ko',
      downloadFileName: '박채원_이력서.pdf',
      downloadPath: '/api/pdf/file/resume-ko',
      filePath: '박채원_이력서.pdf',
      isPdfReady: true,
    });

    render(<AdminPdfUploadPanel initialItems={baseItems} />);

    const resumeInput = screen.getByLabelText('이력서 PDF · 국문 파일 선택', {
      selector: 'input',
    });

    fireEvent.change(resumeInput, {
      target: {
        files: [new File(['pdf'], 'resume-ko.pdf', { type: 'application/pdf' })],
      },
    });

    await waitFor(() => {
      expect(uploadPdfFileByAssetKey).toHaveBeenCalledWith({
        assetKey: 'resume-ko',
        file: expect.any(File),
      });
    });

    const resumeCard = screen
      .getByRole('heading', { level: 3, name: '이력서 PDF · 국문' })
      .closest('article');

    if (!resumeCard) {
      throw new Error('resume card not found');
    }

    await waitFor(() => {
      expect(
        within(resumeCard).getByText('이력서 PDF · 국문 파일을 최신 PDF로 교체했습니다.'),
      ).toBeTruthy();
      expect(
        within(resumeCard).getByRole('link', { name: '다운로드 확인' }).getAttribute('href'),
      ).toBe('/api/pdf/file/resume-ko');
    });
  });

  it('국문 포트폴리오 PDF 업로드 실패 시 인라인 오류를 보여준다', async () => {
    const { uploadPdfFileByAssetKey } =
      await import('@/entities/pdf-file/api/upload-pdf-file-by-asset-key');

    vi.mocked(uploadPdfFileByAssetKey).mockRejectedValue(
      new Error('포트폴리오 PDF · 국문 파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.'),
    );

    render(<AdminPdfUploadPanel initialItems={baseItems} />);

    const portfolioInput = screen.getByLabelText('포트폴리오 PDF · 국문 파일 선택', {
      selector: 'input',
    });

    fireEvent.change(portfolioInput, {
      target: {
        files: [new File(['pdf'], 'portfolio-ko.pdf', { type: 'application/pdf' })],
      },
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          '포트폴리오 PDF · 국문 파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.',
        ),
      ).toBeTruthy();
    });
  });
});
