import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';

const requestJsonApiClientMock = vi.fn();

vi.mock('@/shared/lib/http/request-json-api-client', () => ({
  requestJsonApiClient: (...args: unknown[]) => requestJsonApiClientMock(...args),
}));

describe('DetailMetaBar', () => {
  const clipboardWriteTextMock = vi.fn();
  const originalClipboard = globalThis.navigator.clipboard;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(globalThis.navigator, {
      clipboard: {
        writeText: clipboardWriteTextMock,
      },
    });
  });

  afterEach(() => {
    Object.assign(globalThis.navigator, {
      clipboard: originalClipboard,
    });
  });

  it('마운트 시 조회수 증가 요청 후 최신 값을 표시한다', async () => {
    requestJsonApiClientMock.mockResolvedValue({
      ok: true,
      viewCount: 1234,
    });

    render(
      <DetailMetaBar
        copyFailedText="복사 실패"
        copiedText="복사됨"
        locale="ko"
        primaryMetaText="2026년 1월 - 2026년 2월"
        shareText="공유하기"
        viewCount={0}
        viewCountLabel="조회수"
        viewEndpoint="/api/projects/funda/views"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('1,234')).toBeTruthy();
    });
    expect(requestJsonApiClientMock).toHaveBeenCalledWith({
      fallbackReason: 'failed to increase view count',
      init: {
        cache: 'no-store',
      },
      method: 'POST',
      url: '/api/projects/funda/views',
    });
  });

  it('공유하기 클릭 시 현재 주소를 복사하고 상태를 갱신한다', async () => {
    requestJsonApiClientMock.mockResolvedValue({
      ok: true,
      viewCount: 10,
    });
    clipboardWriteTextMock.mockResolvedValue(undefined);
    window.history.pushState({}, '', '/ko/project/funda');

    render(
      <DetailMetaBar
        copyFailedText="복사 실패"
        copiedText="복사됨"
        locale="ko"
        primaryMetaText="2026년 1월 - 2026년 2월"
        shareText="공유하기"
        viewCount={0}
        viewCountLabel="조회수"
        viewEndpoint="/api/projects/funda/views"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '공유하기' }));

    expect(clipboardWriteTextMock).toHaveBeenCalledWith('http://localhost:3000/ko/project/funda');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '복사됨' })).toBeTruthy();
    });
  });
});
