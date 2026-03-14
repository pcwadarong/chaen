import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';

describe('DetailMetaBar', () => {
  const clipboardWriteTextMock = vi.fn();
  const originalClipboard = globalThis.navigator.clipboard;
  const trackViewActionMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
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
    trackViewActionMock.mockResolvedValue({
      data: {
        viewCount: 1234,
      },
      errorMessage: null,
      ok: true,
    });

    render(
      <DetailMetaBar
        copyFailedText="복사 실패"
        copiedText="복사됨"
        locale="ko"
        primaryMetaText="2026년 1월 - 2026년 2월"
        shareText="공유하기"
        trackViewAction={trackViewActionMock}
        trackViewStorageKey="article:test"
        viewCount={0}
        viewCountLabel="조회수"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('1,234')).toBeTruthy();
    });
    expect(trackViewActionMock).toHaveBeenCalledTimes(1);
  });

  it('공유하기 클릭 시 현재 주소를 복사하고 상태를 갱신한다', async () => {
    trackViewActionMock.mockResolvedValue({
      data: {
        viewCount: 10,
      },
      errorMessage: null,
      ok: true,
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
        trackViewAction={trackViewActionMock}
        trackViewStorageKey="article:test"
        viewCount={0}
        viewCountLabel="조회수"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '공유하기' }));

    expect(clipboardWriteTextMock).toHaveBeenCalledWith('http://localhost:3000/ko/project/funda');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '복사됨' })).toBeTruthy();
    });
  });

  it('보조 메타 텍스트가 있으면 화면에는 primaryMetaText만 노출한다', () => {
    render(
      <DetailMetaBar
        copyFailedText="복사 실패"
        copiedText="복사됨"
        locale="ko"
        primaryMetaScreenReaderText="등록일 2026-03-08"
        primaryMetaText="2026-03-08"
        shareText="공유하기"
      />,
    );

    expect(screen.getByText('2026-03-08')).toBeTruthy();
    expect(screen.getByText('등록일 2026-03-08')).toBeTruthy();
  });

  it('같은 상세 추적 키로 다시 마운트돼도 조회수 요청은 한 번만 보낸다', async () => {
    trackViewActionMock.mockResolvedValue({
      data: {
        viewCount: 10,
      },
      errorMessage: null,
      ok: true,
    });

    const props = {
      copyFailedText: '복사 실패',
      copiedText: '복사됨',
      locale: 'ko',
      primaryMetaText: '2026년 1월 - 2026년 2월',
      shareText: '공유하기',
      trackViewAction: trackViewActionMock,
      trackViewStorageKey: 'article:stable-id',
      viewCount: 0,
      viewCountLabel: '조회수',
    } as const;

    const firstRender = render(<DetailMetaBar {...props} />);

    await waitFor(() => {
      expect(trackViewActionMock).toHaveBeenCalledTimes(1);
    });

    firstRender.unmount();
    render(<DetailMetaBar {...props} />);

    await waitFor(() => {
      expect(trackViewActionMock).toHaveBeenCalledTimes(1);
    });
  });

  it('같은 상세가 pending 상태로 다시 마운트돼도 조회수 요청을 다시 보내지 않는다', async () => {
    window.sessionStorage.setItem('detail-view-tracked:article:pending-id', 'pending');

    render(
      <DetailMetaBar
        copyFailedText="복사 실패"
        copiedText="복사됨"
        locale="ko"
        primaryMetaText="2026년 1월 - 2026년 2월"
        shareText="공유하기"
        trackViewAction={trackViewActionMock}
        trackViewStorageKey="article:pending-id"
        viewCount={0}
        viewCountLabel="조회수"
      />,
    );

    await waitFor(() => {
      expect(trackViewActionMock).not.toHaveBeenCalled();
    });
  });
});
