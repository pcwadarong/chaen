import { fireEvent, screen, waitFor } from '@testing-library/react';

import {
  actionPopoverRenderCount,
  composeFormSpy,
  initialPage,
  renderArticleCommentsSection,
  resetArticleCommentsSectionTestState,
  sortButtonRenderCount,
} from '@/widgets/article-comments/ui/article-comments-section.test-support';

describe('ArticleCommentsSection interactions', () => {
  beforeEach(() => {
    resetArticleCommentsSectionTestState();
  });

  it('루트 작성 폼에 embedded textarea 설정을 전달한다', () => {
    renderArticleCommentsSection({ initialPage });

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
  });

  it('페이지네이션은 하단에만 한 번 렌더링한다', () => {
    renderArticleCommentsSection({ initialPage });

    expect(screen.getAllByRole('navigation', { name: 'paginationLabel' })).toHaveLength(1);
  });

  it('비밀글 UI 없이 댓글 내용을 바로 노출한다', () => {
    renderArticleCommentsSection({ initialPage });

    expect(screen.queryByRole('button', { name: 'secretReveal' })).toBeNull();
    expect(screen.getByText('root content')).toBeTruthy();
  });

  it('답글 달기를 누르면 해당 스레드 아래에 답글 폼을 노출한다', async () => {
    renderArticleCommentsSection({ initialPage });

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
    renderArticleCommentsSection({ initialPage });

    fireEvent.click(screen.getAllByRole('button', { name: 'actionMenuLabel' })[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'actionMenuPanelLabel' })).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'edit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'delete' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'report' })).toBeTruthy();
  });

  it('루트 작성 폼 입력 중에는 기존 댓글 액션 카드를 다시 그리지 않는다', () => {
    renderArticleCommentsSection({ initialPage });

    expect(actionPopoverRenderCount.value).toBe(2);

    fireEvent.change(screen.getByLabelText('root-compose-input'), {
      target: { value: 'hello comments' },
    });

    expect(actionPopoverRenderCount.value).toBe(2);
  });

  it('루트 작성 폼 입력 중에는 정렬 탭을 다시 그리지 않는다', () => {
    renderArticleCommentsSection({ initialPage });

    expect(sortButtonRenderCount.value).toBe(2);

    fireEvent.change(screen.getByLabelText('root-compose-input'), {
      target: { value: 'hello sort tabs' },
    });

    expect(sortButtonRenderCount.value).toBe(2);
  });
});
