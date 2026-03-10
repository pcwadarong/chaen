import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { getArticleCommentsPageAction } from '@/entities/article-comment/api/article-comment-actions';
import type { ArticleCommentPage } from '@/entities/article-comment/model/types';

import { ArticleCommentsSection } from './article-comments-section';

const composeFormSpy = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    if (key === 'composeReplyPlaceholder') {
      return `reply:${values?.authorName ?? ''}`;
    }

    return key;
  },
}));

vi.mock('@/entities/article-comment/api/article-comment-actions', () => ({
  deleteArticleCommentAction: vi.fn(),
  getArticleCommentsPageAction: vi.fn(),
  initialSubmitArticleCommentState: {
    data: null,
    errorMessage: null,
    ok: false,
  },
  submitArticleComment: vi.fn(),
  updateArticleCommentAction: vi.fn(),
}));

vi.mock('@/shared/ui/comment-compose-form', () => ({
  CommentComposeForm: (props: Record<string, unknown> & { isReplyMode?: boolean }) => {
    composeFormSpy(props);

    return (
      <div>
        <button type="button">
          {props.isReplyMode ? 'reply-compose-form' : 'root-compose-form'}
        </button>
      </div>
    );
  },
}));

vi.mock('@/shared/ui/modal/modal', () => ({
  Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock('@/shared/ui/toast/toast', () => ({
  ToastViewport: () => null,
}));

const initialPage: ArticleCommentPage = {
  items: [
    {
      article_id: 'article-1',
      author_blog_url: 'https://example.com',
      author_name: 'chaen',
      content: 'root content',
      created_at: '2026-03-08T00:00:00.000Z',
      deleted_at: null,
      id: 'comment-1',
      parent_id: null,
      reply_to_author_name: null,
      reply_to_comment_id: null,
      replies: [
        {
          article_id: 'article-1',
          author_blog_url: null,
          author_name: 'river',
          content: 'reply content',
          created_at: '2026-03-08T00:10:00.000Z',
          deleted_at: null,
          id: 'reply-1',
          parent_id: 'comment-1',
          reply_to_author_name: 'chaen',
          reply_to_comment_id: 'comment-1',
          updated_at: '2026-03-08T00:10:00.000Z',
        },
      ],
      updated_at: '2026-03-08T00:00:00.000Z',
    },
  ],
  page: 1,
  pageSize: 10,
  sort: 'latest',
  totalCount: 12,
  totalPages: 2,
};

describe('ArticleCommentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('루트 작성 폼에 embedded textarea 설정을 전달한다', () => {
    render(<ArticleCommentsSection articleId="article-1" initialPage={initialPage} locale="ko" />);

    expect(composeFormSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        allowSecretToggle: false,
        formAction: expect.any(Function),
        hiddenFields: {
          articleId: 'article-1',
          locale: 'ko',
        },
        isReplyMode: false,
        layout: 'embedded',
        submissionResult: {
          data: null,
          errorMessage: null,
          ok: false,
        },
        textareaAutoResize: false,
        textareaRows: 4,
      }),
    );
    expect(screen.getByRole('button', { name: 'root-compose-form' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'reply' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'chaen' }).getAttribute('href')).toBe(
      'https://example.com',
    );
  });

  it('정렬과 페이지 이동 시 댓글 목록을 다시 조회한다', async () => {
    vi.mocked(getArticleCommentsPageAction).mockResolvedValue({
      data: {
        ...initialPage,
        items: [],
        page: 2,
        sort: 'oldest',
        totalCount: 0,
      },
      errorMessage: null,
      ok: true,
    });

    render(<ArticleCommentsSection articleId="article-1" initialPage={initialPage} locale="ko" />);

    fireEvent.click(screen.getByRole('tab', { name: 'sortOldest' }));
    fireEvent.click(screen.getAllByRole('button', { name: '2' })[0]);

    await waitFor(() => {
      expect(getArticleCommentsPageAction).toHaveBeenNthCalledWith(1, {
        articleId: 'article-1',
        fresh: undefined,
        locale: 'ko',
        page: 1,
        sort: 'oldest',
      });
      expect(getArticleCommentsPageAction).toHaveBeenNthCalledWith(2, {
        articleId: 'article-1',
        fresh: undefined,
        locale: 'ko',
        page: 2,
        sort: 'latest',
      });
    });
  });

  it('페이지네이션은 하단에만 한 번 렌더링한다', () => {
    render(<ArticleCommentsSection articleId="article-1" initialPage={initialPage} locale="ko" />);

    expect(screen.getAllByRole('navigation', { name: 'paginationLabel' })).toHaveLength(1);
  });

  it('비밀글 UI 없이 댓글 내용을 바로 노출한다', () => {
    render(<ArticleCommentsSection articleId="article-1" initialPage={initialPage} locale="ko" />);

    expect(screen.queryByRole('button', { name: 'secretReveal' })).toBeNull();
    expect(screen.getByText('root content')).toBeTruthy();
  });

  it('답글 달기를 누르면 해당 스레드 아래에 답글 폼을 노출한다', async () => {
    render(<ArticleCommentsSection articleId="article-1" initialPage={initialPage} locale="ko" />);

    fireEvent.click(screen.getAllByRole('button', { name: 'reply' })[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'reply-compose-form' })).toBeTruthy();
    });
    expect(composeFormSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        allowSecretToggle: false,
        formAction: expect.any(Function),
        hiddenFields: {
          articleId: 'article-1',
          locale: 'ko',
          parentId: 'comment-1',
          replyToCommentId: 'comment-1',
        },
        isReplyMode: true,
        submissionResult: {
          data: null,
          errorMessage: null,
          ok: false,
        },
        textPlaceholder: 'reply:chaen',
      }),
    );
  });

  it('kebab 메뉴를 열면 수정/삭제/신고 액션을 노출한다', async () => {
    render(<ArticleCommentsSection articleId="article-1" initialPage={initialPage} locale="ko" />);

    fireEvent.click(screen.getAllByRole('button', { name: 'actionMenuLabel' })[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'actionMenuPanelLabel' })).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'edit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'delete' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'report' })).toBeTruthy();
  });
});
