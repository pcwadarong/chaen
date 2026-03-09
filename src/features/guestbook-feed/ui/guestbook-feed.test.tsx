import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { GuestbookFeed } from '@/features/guestbook-feed/ui/guestbook-feed';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

import '@testing-library/jest-dom/vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    (
      ({
        delete: '삭제',
        edit: '수정',
        emptyItems: '비어 있음',
        loadError: '불러오기 실패',
        loadMoreEnd: '마지막 방명록까지 모두 확인했습니다.',
        loading: '불러오는 중',
        passwordInput: '비밀번호',
        reply: '답글',
        requiredField: '필수값입니다.',
        retry: '다시 시도',
        secretPlaceholder: '비밀번호 입력',
        secretReveal: '비밀글 열기',
        secretRevealTitle: '비밀글 확인',
        secretVerifyFailed: '비밀번호가 일치하지 않습니다.',
        confirm: '확인',
      }) satisfies Record<string, string>
    )[key] ?? key,
}));

vi.mock('@/entities/guestbook/ui/guestbook-thread-card', () => ({
  GuestbookThreadCard: ({ entry }: { entry: { content: string } }) => (
    <article>{entry.content}</article>
  ),
}));

describe('GuestbookFeed', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      value: class {
        disconnect() {}
        observe() {}
      },
      writable: true,
    });
  });

  it('마지막 안내 문구를 스크린리더 전용 상태 텍스트로 렌더링한다', () => {
    render(
      <GuestbookFeed
        canReply={false}
        errorMessage={null}
        hasMore={false}
        isInitialLoading={false}
        isLoadingMore={false}
        items={[
          {
            author_blog_url: null,
            author_name: 'chaen',
            content: '방명록 본문',
            created_at: '2026-03-08T00:00:00.000Z',
            deleted_at: null,
            id: 'entry-1',
            is_admin_author: false,
            is_content_masked: false,
            is_secret: false,
            parent_id: null,
            replies: [],
            updated_at: '2026-03-08T00:00:00.000Z',
          },
        ]}
        onDeleteReply={vi.fn()}
        onDelete={vi.fn()}
        onEditReply={vi.fn()}
        onEdit={vi.fn()}
        onLoadMore={vi.fn(async () => {})}
        onReply={vi.fn()}
        onRetry={vi.fn(async () => {})}
        onRevealSecret={vi.fn(async () => {})}
      />,
    );

    const endMessage = screen.getByText('마지막 방명록까지 모두 확인했습니다.');

    expect(endMessage).toHaveAttribute('aria-live', 'polite');
    expect(endMessage).toHaveClass(srOnlyClass);
  });
});
