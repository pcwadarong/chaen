import { render } from '@testing-library/react';
import React from 'react';

import type { ArticleCommentPage } from '@/entities/article/comment/model';
import {
  ArticleCommentsSection,
  resetArticleCommentsPageCacheForTest,
} from '@/widgets/article-comments/ui/article-comments-section';

import '@testing-library/jest-dom/vitest';

const hoistedRenderState = vi.hoisted(() => ({
  actionPopoverRenderCount: {
    value: 0,
  },
  sortButtonRenderCount: {
    value: 0,
  },
}));
const mockedCommentActions = vi.hoisted(() => ({
  deleteArticleCommentAction: vi.fn(),
  getArticleCommentsPageAction: vi.fn(),
  submitArticleComment: vi.fn(),
  updateArticleCommentAction: vi.fn(),
}));

export const composeFormSpy = vi.fn();
export const actionPopoverRenderCount = hoistedRenderState.actionPopoverRenderCount;
export const mockedGetArticleCommentsPageAction = mockedCommentActions.getArticleCommentsPageAction;
export const sortButtonRenderCount = hoistedRenderState.sortButtonRenderCount;

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    if (key === 'composeReplyPlaceholder') {
      return `reply:${values?.authorName ?? ''}`;
    }

    return key;
  },
}));

vi.mock('@/features/browse-article-comments/api/get-article-comments-page', () => ({
  getArticleCommentsPageAction: mockedCommentActions.getArticleCommentsPageAction,
}));

vi.mock('@/features/create-article-comment/api/submit-article-comment', () => ({
  submitArticleComment: mockedCommentActions.submitArticleComment,
}));

vi.mock('@/features/create-article-comment/api/submit-article-comment.state', () => ({
  initialSubmitArticleCommentState: {
    data: null,
    errorMessage: null,
    ok: false,
  },
}));

vi.mock('@/features/manage-article-comment/api/update-article-comment', () => ({
  updateArticleCommentAction: mockedCommentActions.updateArticleCommentAction,
}));

vi.mock('@/features/manage-article-comment/api/delete-article-comment', () => ({
  deleteArticleCommentAction: mockedCommentActions.deleteArticleCommentAction,
}));

vi.mock('@/shared/ui/comment-compose', () => ({
  CommentComposeForm: (props: Record<string, unknown> & { isReplyMode?: boolean }) => {
    composeFormSpy(props);
    const [value, setValue] = React.useState('');

    return (
      <div>
        <input
          aria-label={props.isReplyMode ? 'reply-compose-input' : 'root-compose-input'}
          onChange={event => setValue(event.target.value)}
          value={value}
        />
        <button type="button">
          {props.isReplyMode ? 'reply-compose-form' : 'root-compose-form'}
        </button>
      </div>
    );
  },
}));

vi.mock('@/shared/ui/button/button', () => ({
  Button: ({
    children,
    role,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => {
    if (role === 'tab') {
      sortButtonRenderCount.value += 1;
    }

    return (
      <button role={role} type="button" {...props}>
        {children}
      </button>
    );
  },
}));

vi.mock('@/shared/ui/action-popover/action-popover', () => ({
  ActionMenuButton: ({
    ariaDisabled,
    label,
    onClick,
  }: {
    ariaDisabled?: boolean;
    label: string;
    onClick?: () => void;
  }) => (
    <button aria-disabled={ariaDisabled} onClick={onClick} type="button">
      {label}
    </button>
  ),
  ActionPopover: ({
    children,
    isOpen,
    onOpenChange,
    panelLabel,
    triggerLabel,
  }: {
    children: (controls: { closePopover: () => void }) => React.ReactNode;
    isOpen: boolean;
    onOpenChange: (nextOpen: boolean) => void;
    panelLabel: string;
    triggerLabel: string;
  }) => {
    actionPopoverRenderCount.value += 1;

    return (
      <div>
        <button onClick={() => onOpenChange(!isOpen)} type="button">
          {triggerLabel}
        </button>
        {isOpen ? (
          <div aria-label={panelLabel} role="dialog">
            {children({
              closePopover: () => onOpenChange(false),
            })}
          </div>
        ) : null}
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

export const initialPage: ArticleCommentPage = {
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

/**
 * 댓글 섹션 테스트 공통 상태를 초기화합니다.
 */
export const resetArticleCommentsSectionTestState = () => {
  vi.clearAllMocks();
  actionPopoverRenderCount.value = 0;
  sortButtonRenderCount.value = 0;
  resetArticleCommentsPageCacheForTest();
};

/**
 * 기본 props로 댓글 섹션을 렌더링합니다.
 */
export const renderArticleCommentsSection = (props?: {
  articleId?: string;
  initialPage?: ArticleCommentPage;
  locale?: string;
}) =>
  render(
    <ArticleCommentsSection
      articleId={props?.articleId ?? 'article-1'}
      initialPage={props?.initialPage}
      locale={props?.locale ?? 'ko'}
    />,
  );

/**
 * 첫 댓글 페이지 조회 mock을 성공 응답으로 맞춥니다.
 */
export const mockInitialCommentsPageRequest = () =>
  mockedGetArticleCommentsPageAction.mockResolvedValueOnce({
    data: initialPage,
    errorMessage: null,
    ok: true,
  });
