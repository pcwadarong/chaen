import { render, screen } from '@testing-library/react';
import React from 'react';

import { CommentsLoadingSkeleton } from '@/widgets/article-comments/ui/thread/article-comments-thread-list-skeleton';

describe('CommentsLoadingSkeleton', () => {
  it('loading 상태를 role과 aria-label로 노출한다', () => {
    render(<CommentsLoadingSkeleton loadingText="댓글 불러오는 중" />);

    const status = screen.getByRole('status');

    expect(status.getAttribute('aria-label')).toBe('댓글 불러오는 중');
    expect(status.getAttribute('aria-busy')).toBe('true');
  });
});
