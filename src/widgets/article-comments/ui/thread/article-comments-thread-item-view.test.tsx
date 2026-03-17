import { render, screen } from '@testing-library/react';
import React from 'react';

import type { ArticleCommentThreadItem } from '@/entities/article/comment/model';
import { createArticleCommentsText } from '@/widgets/article-comments/ui/state/article-comments-text';
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

const text = createArticleCommentsText(key => key);

const thread: ArticleCommentThreadItem = {
  article_id: 'article-1',
  author_blog_url: null,
  author_name: 'guest',
  content: 'thread content',
  created_at: '2026-03-17T00:00:00.000Z',
  deleted_at: null,
  id: 'thread-1',
  reply_to_author_name: null,
  reply_to_comment_id: null,
  parent_id: null,
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
          authorName: 'guest',
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
