import { render, screen } from '@testing-library/react';
import React from 'react';

import { CommentThreadItemView } from '@/widgets/article-comments/ui/thread/article-comments-thread-item-view';

const commentComposeFormProps = vi.fn();

vi.mock('@/entities/article/comment/ui/comment-entry-card', () => ({
  CommentEntryCard: () => <div data-testid="comment-entry-card" />,
}));

vi.mock('@/shared/ui/comment-compose', () => ({
  CommentComposeForm: (props: unknown) => {
    commentComposeFormProps(props);
    return <div data-testid="comment-compose-form" />;
  },
}));

const text = {
  actionDeleteLabel: '삭제',
  actionEditLabel: '수정',
  actionMenuLabel: '메뉴',
  actionMenuPanelLabel: '패널',
  actionReplyLabel: '답글',
  composeAuthorBlogUrlInvalidMessage: '',
  composeAuthorBlogUrlLabel: '',
  composeAuthorBlogUrlPlaceholder: '',
  composeAuthorNameLabel: '',
  composeAuthorNamePlaceholder: '',
  composeCharacterCountLabel: '',
  composeContentShortcutHint: '',
  composePasswordLabel: '비밀번호',
  composePasswordPlaceholder: '비밀번호',
  composeReplyContentLabel: '답글',
  composeReplyPreviewLabel: '원문',
  deletedPlaceholder: '',
  report: '신고',
  submit: '등록',
} as const;

const thread = {
  author_blog_url: null,
  author_name: 'guest',
  content: 'thread content',
  created_at: '2026-03-17T00:00:00.000Z',
  deleted_at: null,
  id: 'thread-1',
  is_secret: false,
  parent_id: null,
  password: null,
  replies: [],
  updated_at: '2026-03-17T00:00:00.000Z',
};

describe('CommentThreadItemView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reply target이 현재 thread면 embedded 답글 폼을 렌더링한다', () => {
    render(
      <CommentThreadItemView
        articleId="article-1"
        isReplySubmitting={false}
        locale="ko"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onReply={vi.fn()}
        replyPlaceholder="답글을 입력하세요"
        replySubmitState={{ data: null, errorMessage: null, ok: false }}
        replyTarget={{
          commentId: 'thread-1',
          content: '원문',
          parentId: 'thread-1',
        }}
        submitReplyCommentAction={vi.fn()}
        text={text}
        thread={thread}
      />,
    );

    expect(screen.getByTestId('comment-compose-form')).toBeTruthy();
    expect(commentComposeFormProps).toHaveBeenCalledWith(
      expect.objectContaining({
        hiddenFields: {
          articleId: 'article-1',
          locale: 'ko',
          parentId: 'thread-1',
          replyToCommentId: 'thread-1',
        },
        layout: 'embedded',
      }),
    );
  });
});
