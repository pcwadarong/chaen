import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';

import { AdminPdfUploadPanel } from '@/widgets/admin-pdf-upload/ui/admin-pdf-upload-panel';

vi.mock('@/entities/pdf-file/api/upload-pdf-file-by-kind', () => ({
  uploadPdfFileByKind: vi.fn(),
}));

const baseItems = [
  {
    description: '이력서 페이지에서 노출되는 resume PDF를 교체합니다.',
    downloadFileName: 'ParkChaewon-Resume.pdf',
    downloadPath: '/api/pdf/resume',
    filePath: 'ParkChaewon-Resume.pdf',
    isPdfReady: false,
    kind: 'resume' as const,
    title: '이력서 PDF',
  },
  {
    description: '프로젝트 페이지에서 노출되는 포트폴리오 PDF를 교체합니다.',
    downloadFileName: 'ParkChaewon-Portfolio.pdf',
    downloadPath: '/api/pdf/portfolio',
    filePath: 'ParkChaewon-Portfolio.pdf',
    isPdfReady: true,
    kind: 'portfolio' as const,
    title: '포트폴리오 PDF',
  },
];

describe('AdminPdfUploadPanel', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('고정 파일명과 현재 업로드 상태를 함께 보여준다', () => {
    render(<AdminPdfUploadPanel initialItems={baseItems} />);

    expect(screen.getByRole('heading', { level: 2, name: 'PDF 파일 관리' })).toBeTruthy();
    expect(screen.getAllByText('ParkChaewon-Resume.pdf')).toHaveLength(2);
    expect(screen.getAllByText('ParkChaewon-Portfolio.pdf')).toHaveLength(2);
    expect(screen.getByText('업로드 필요')).toBeTruthy();
    expect(screen.getByText('업로드됨')).toBeTruthy();
  });

  it('resume PDF 업로드 성공 시 카드 상태를 최신 결과로 갱신한다', async () => {
    const { uploadPdfFileByKind } = await import('@/entities/pdf-file/api/upload-pdf-file-by-kind');

    vi.mocked(uploadPdfFileByKind).mockResolvedValue({
      downloadFileName: 'ParkChaewon-Resume.pdf',
      downloadPath: '/api/pdf/resume',
      filePath: 'ParkChaewon-Resume.pdf',
      isPdfReady: true,
    });

    render(<AdminPdfUploadPanel initialItems={baseItems} />);

    const resumeInput = screen.getByLabelText('이력서 PDF 파일 선택', {
      selector: 'input',
    });

    fireEvent.change(resumeInput, {
      target: {
        files: [new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })],
      },
    });

    await waitFor(() => {
      expect(uploadPdfFileByKind).toHaveBeenCalledWith({
        file: expect.any(File),
        kind: 'resume',
      });
    });

    const resumeCard = screen
      .getByRole('heading', { level: 3, name: '이력서 PDF' })
      .closest('article');

    if (!resumeCard) {
      throw new Error('resume card not found');
    }

    await waitFor(() => {
      expect(within(resumeCard).getByText('업로드됨')).toBeTruthy();
      expect(within(resumeCard).getByText('이력서 PDF를 최신 파일로 교체했습니다.')).toBeTruthy();
    });
  });

  it('portfolio PDF 업로드 실패 시 인라인 오류를 보여준다', async () => {
    const { uploadPdfFileByKind } = await import('@/entities/pdf-file/api/upload-pdf-file-by-kind');

    vi.mocked(uploadPdfFileByKind).mockRejectedValue(
      new Error('포트폴리오 PDF 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.'),
    );

    render(<AdminPdfUploadPanel initialItems={baseItems} />);

    const portfolioInput = screen.getByLabelText('포트폴리오 PDF 파일 선택', {
      selector: 'input',
    });

    fireEvent.change(portfolioInput, {
      target: {
        files: [new File(['pdf'], 'portfolio.pdf', { type: 'application/pdf' })],
      },
    });

    await waitFor(() => {
      expect(
        screen.getByText('포트폴리오 PDF 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.'),
      ).toBeTruthy();
    });
  });
});
