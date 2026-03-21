import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { createEditorError, EDITOR_ERROR_MESSAGE } from '@/entities/editor/model/editor-error';
import { optimizeThumbnailImageFile } from '@/shared/lib/image/optimize-thumbnail-image-file';
import type { PublishSettings } from '@/widgets/editor/ui/core/editor-core.types';
import { PublishPanel } from '@/widgets/editor/ui/publish/publish-panel';
import { createDefaultPublishSettings } from '@/widgets/editor/ui/publish/publish-panel.utils';

import '@testing-library/jest-dom/vitest';

vi.mock('@/shared/lib/image/optimize-thumbnail-image-file', () => ({
  optimizeThumbnailImageFile: vi.fn(async (file: File) => file),
}));

const baseEditorState = {
  dirty: true,
  slug: 'editor-core',
  tags: [],
  translations: {
    en: { content: '', description: '', title: '' },
    fr: { content: '', description: '', title: '' },
    ja: { content: '', description: '', title: '' },
    ko: { content: '본문', description: '', title: '한국어 제목' },
  },
};

/**
 * slug 사용 가능 확인 API 응답을 테스트에서 공통으로 모킹합니다.
 */
const mockSlugCheckResponse = (duplicate = false) =>
  vi.spyOn(global, 'fetch').mockResolvedValue({
    json: async () => ({ duplicate }),
    ok: true,
  } as Response);

/**
 * 패널 테스트용 기본 렌더러입니다.
 */
const renderPublishPanel = (
  options?: Partial<React.ComponentProps<typeof PublishPanel>> & {
    editorState?: React.ComponentProps<typeof PublishPanel>['editorState'];
  },
) => {
  const onClose = options?.onClose ?? vi.fn();
  const onSubmit = options?.onSubmit ?? vi.fn().mockResolvedValue(undefined);

  const renderResult = render(
    <PublishPanel
      contentType={options?.contentType ?? 'article'}
      editorState={options?.editorState ?? { ...baseEditorState }}
      initialSettings={options?.initialSettings}
      isOpen={options?.isOpen ?? true}
      isPublished={options?.isPublished}
      publicationState={options?.publicationState}
      onClose={onClose}
      onSubmit={onSubmit}
    />,
  );

  return {
    onClose,
    onSubmit,
    unmount: renderResult.unmount,
  };
};

describe('PublishPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(optimizeThumbnailImageFile).mockImplementation(async (file: File) => file);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('공개 설정은 공개와 비공개만 노출한다', async () => {
    renderPublishPanel();

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '발행 설정' })).toBeTruthy();
    });

    expect(screen.getByLabelText('공개')).toBeTruthy();
    expect(screen.getByLabelText('비공개')).toBeTruthy();
    expect(screen.queryByLabelText('임시')).toBeNull();
  });

  it('backdrop 클릭 시 패널을 닫는다', async () => {
    const { onClose } = renderPublishPanel();

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '발행 설정' })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('dialog').parentElement as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('예약 발행 선택 시 UTC 변환 결과를 실시간으로 표시한다', async () => {
    renderPublishPanel();

    fireEvent.click(screen.getByLabelText('예약 발행'));
    fireEvent.change(screen.getByLabelText('날짜'), {
      target: { value: '2026-03-20' },
    });
    fireEvent.change(screen.getByLabelText('시간'), {
      target: { value: '10:00' },
    });

    expect(await screen.findByText('UTC: 2026-03-20T01:00:00.000Z')).toBeTruthy();
  });

  it('이미 발행된 글을 수정할 때는 publishAt이 있어도 기본 모드를 지금 발행으로 둔다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T09:00:00.000Z'));

    renderPublishPanel({
      initialSettings: {
        allowComments: true,
        githubUrl: '',
        publishAt: '2026-03-10T09:00:00.000Z',
        slug: 'published-article',
        thumbnailUrl: '',
        visibility: 'public',
        websiteUrl: '',
      },
      isPublished: true,
      publicationState: 'published',
    });

    expect(screen.getByLabelText('지금 발행')).toBeChecked();
    expect(screen.getByLabelText('예약 발행')).not.toBeChecked();
    expect(screen.queryByLabelText('날짜')).toBeNull();
  });

  it('이미 발행된 글은 예약 발행을 다시 선택할 수 없다', async () => {
    renderPublishPanel({
      initialSettings: {
        allowComments: true,
        githubUrl: '',
        publishAt: '2026-03-10T09:00:00.000Z',
        slug: 'published-article',
        thumbnailUrl: '',
        visibility: 'public',
        websiteUrl: '',
      },
      isPublished: true,
      publicationState: 'published',
    });

    const scheduledRadio = screen.getByLabelText('예약 발행');

    expect(scheduledRadio).toBeDisabled();
    expect(
      screen.getByText('이미 공개된 콘텐츠는 예약 발행으로 다시 전환할 수 없습니다.'),
    ).toBeTruthy();

    fireEvent.click(scheduledRadio);

    expect(screen.getByLabelText('지금 발행')).toBeChecked();
    expect(screen.queryByLabelText('날짜')).toBeNull();
  });

  it('아직 공개 전인 예약 article/project는 예약 발행을 수정할 수 있다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T00:00:00.000Z'));

    renderPublishPanel({
      initialSettings: {
        allowComments: true,
        githubUrl: '',
        publishAt: '2026-03-20T01:00:00.000Z',
        slug: 'scheduled-article',
        thumbnailUrl: '',
        visibility: 'public',
        websiteUrl: '',
      },
      isPublished: true,
      publicationState: 'scheduled',
    });

    expect(screen.getByLabelText('예약 발행')).not.toBeDisabled();
    expect(screen.getByLabelText('예약 발행')).toBeChecked();
    expect(screen.getByLabelText('날짜')).toBeTruthy();
    expect(
      screen.queryByText('이미 공개된 콘텐츠는 예약 발행으로 다시 전환할 수 없습니다.'),
    ).toBeNull();
  });

  it('draft article에서는 댓글 허용을 계속 조정할 수 있다', async () => {
    const { onSubmit } = renderPublishPanel({
      initialSettings: {
        allowComments: true,
        githubUrl: '',
        publishAt: null,
        slug: 'draft-article',
        thumbnailUrl: '',
        visibility: 'public',
        websiteUrl: '',
      },
      publicationState: 'draft',
    });

    const commentCheckbox = screen.getByLabelText('댓글 허용');

    expect(commentCheckbox).not.toBeDisabled();
    expect(commentCheckbox).toBeChecked();

    mockSlugCheckResponse(false);
    fireEvent.click(screen.getByRole('button', { hidden: true, name: '사용 가능 확인' }));
    await screen.findByText('사용 가능한 슬러그입니다.');
    fireEvent.click(screen.getByRole('button', { hidden: true, name: '발행하기' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          allowComments: true,
        }),
      );
    });
  });

  it('published article 수정에서는 댓글 허용을 계속 조정할 수 있다', () => {
    renderPublishPanel({
      initialSettings: {
        allowComments: true,
        githubUrl: '',
        publishAt: null,
        slug: 'published-article',
        thumbnailUrl: '',
        visibility: 'public',
        websiteUrl: '',
      },
      isPublished: true,
      publicationState: 'published',
    });

    const commentCheckbox = screen.getByLabelText('댓글 허용');

    expect(commentCheckbox).not.toBeDisabled();
    expect(commentCheckbox).toBeChecked();
  });

  it('project에서는 publication state와 무관하게 댓글 허용이 비활성화된다', () => {
    for (const publicationState of ['draft', 'scheduled', 'published'] as const) {
      const { unmount } = renderPublishPanel({
        contentType: 'project',
        initialSettings: {
          allowComments: false,
          githubUrl: '',
          publishAt: null,
          slug: `${publicationState}-project`,
          thumbnailUrl: '',
          visibility: 'public',
          websiteUrl: '',
        },
        isPublished: publicationState !== 'draft',
        publicationState,
      });

      expect(screen.queryByLabelText('댓글 허용')).toBeNull();

      unmount();
    }
  });

  it('project 발행 패널은 외부 링크 입력을 노출하고 제출 payload에 포함한다', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderPublishPanel({
      contentType: 'project',
      initialSettings: {
        allowComments: false,
        githubUrl: '',
        publishAt: null,
        slug: 'project-with-links',
        thumbnailUrl: '',
        visibility: 'public',
        websiteUrl: '',
      },
      onSubmit,
    });

    fireEvent.change(screen.getByLabelText('웹사이트'), {
      target: { value: 'https://chaen.dev/project' },
    });
    fireEvent.change(screen.getByLabelText('GitHub'), {
      target: { value: 'https://github.com/chaen/project' },
    });

    mockSlugCheckResponse(false);
    fireEvent.click(screen.getByRole('button', { hidden: true, name: '사용 가능 확인' }));
    await screen.findByText('사용 가능한 슬러그입니다.');
    fireEvent.click(screen.getByRole('button', { hidden: true, name: '발행하기' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          githubUrl: 'https://github.com/chaen/project',
          websiteUrl: 'https://chaen.dev/project',
        }),
      );
    });
  });

  it('예약 발행 입력은 현재 시각 이전을 고르지 못하게 최소값을 노출한다', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-03-14T09:27:45.000Z');
    const expectedDate = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`;
    const expectedTime = `${`${now.getHours()}`.padStart(2, '0')}:${`${now.getMinutes()}`.padStart(2, '0')}`;
    vi.setSystemTime(now);

    renderPublishPanel();

    fireEvent.click(screen.getByLabelText('예약 발행'));

    expect(screen.getByLabelText('날짜')).toHaveAttribute('min', expectedDate);
    expect(screen.getByLabelText('시간')).toHaveAttribute('min', expectedTime);

    fireEvent.change(screen.getByLabelText('날짜'), {
      target: { value: '2026-03-15' },
    });

    expect(screen.getByLabelText('시간')).not.toHaveAttribute('min');
  });

  it('draft slug가 있는 상태에서 패널이 열리면 부모 동기화로 빈 값으로 되돌아가지 않는다', async () => {
    const PublishPanelHarness = () => {
      const [settings, setSettings] = React.useState<PublishSettings>(() =>
        createDefaultPublishSettings({
          contentType: 'article',
          initialSettings: {
            allowComments: true,
            githubUrl: '',
            publishAt: null,
            slug: 'draft-slug',
            thumbnailUrl: '',
            visibility: 'public',
            websiteUrl: '',
          },
          slug: '',
        }),
      );

      return (
        <>
          <PublishPanel
            contentType="article"
            editorState={{
              ...baseEditorState,
              slug: '',
            }}
            initialSettings={settings}
            isOpen
            onClose={vi.fn()}
            onSettingsChange={setSettings}
            onSubmit={vi.fn().mockResolvedValue(undefined)}
          />
          <output data-testid="settings-slug">{settings.slug}</output>
        </>
      );
    };

    render(<PublishPanelHarness />);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: '슬러그' })).toHaveValue('draft-slug');
    });

    expect(screen.getByTestId('settings-slug')).toHaveTextContent('draft-slug');
  });

  it('썸네일 URL을 바꿔도 부모 동기화 때문에 입력값이 다시 초기화되지 않는다', async () => {
    const PublishPanelHarness = () => {
      const [settings, setSettings] = React.useState<PublishSettings>(() =>
        createDefaultPublishSettings({
          contentType: 'article',
          initialSettings: {
            allowComments: true,
            githubUrl: '',
            publishAt: null,
            slug: 'draft-slug',
            thumbnailUrl: 'https://example.com/original.png',
            visibility: 'public',
            websiteUrl: '',
          },
          slug: '',
        }),
      );

      return (
        <>
          <PublishPanel
            contentType="article"
            editorState={{
              ...baseEditorState,
              slug: '',
            }}
            initialSettings={settings}
            isOpen
            onClose={vi.fn()}
            onSettingsChange={setSettings}
            onSubmit={vi.fn().mockResolvedValue(undefined)}
          />
          <output data-testid="settings-thumbnail">{settings.thumbnailUrl}</output>
        </>
      );
    };

    render(<PublishPanelHarness />);

    const thumbnailInput = await screen.findByLabelText('썸네일');

    fireEvent.change(thumbnailInput, {
      target: { value: 'https://example.com/next-thumb.png' },
    });

    await waitFor(() => {
      expect(screen.getByLabelText('썸네일')).toHaveValue('https://example.com/next-thumb.png');
      expect(screen.getByTestId('settings-thumbnail')).toHaveTextContent(
        'https://example.com/next-thumb.png',
      );
    });
  });

  it('validation 오류가 있으면 인라인 에러를 표시하고 제출하지 않는다', async () => {
    const { onSubmit } = renderPublishPanel({
      editorState: {
        ...baseEditorState,
        translations: {
          ...baseEditorState.translations,
          ko: { content: '본문', description: '', title: '' },
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '발행 설정' })).toBeTruthy();
    });

    fireEvent.change(screen.getByRole('textbox', { name: '슬러그' }), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByLabelText('예약 발행'));
    fireEvent.change(screen.getByLabelText('날짜'), {
      target: { value: '2026-03-01' },
    });
    fireEvent.change(screen.getByLabelText('시간'), {
      target: { value: '10:00' },
    });
    fireEvent.click(screen.getByRole('button', { hidden: true, name: '발행하기' }));

    expect(await screen.findByText('한국어 제목을 입력해주세요')).toBeTruthy();
    expect(screen.getByText('슬러그를 입력해주세요')).toBeTruthy();
    expect(screen.getByText('발행 시간은 현재 시간 이후여야 합니다')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('사용 가능 확인을 하지 않은 slug는 발행할 수 없다', async () => {
    const { onSubmit } = renderPublishPanel();

    fireEvent.change(screen.getByLabelText('슬러그'), {
      target: { value: 'Hello World!!' },
    });
    fireEvent.click(screen.getByRole('button', { hidden: true, name: '발행하기' }));

    expect(await screen.findByText(EDITOR_ERROR_MESSAGE.slugVerificationRequired)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('사용 가능 확인 후에는 정규화된 slug로 발행한다', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    mockSlugCheckResponse(false);
    renderPublishPanel({ onSubmit });

    fireEvent.change(screen.getByLabelText('슬러그'), {
      target: { value: 'Hello World!!' },
    });
    fireEvent.click(screen.getByRole('button', { hidden: true, name: '사용 가능 확인' }));

    await waitFor(() => {
      expect(screen.getByLabelText('슬러그')).toHaveValue('hello-world');
    });

    fireEvent.click(screen.getByRole('button', { hidden: true, name: '발행하기' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'hello-world',
        }),
      );
    });
  });

  it('파일 업로드 성공 시 thumbnailUrl과 미리보기를 갱신한다', async () => {
    const optimizedFile = new File(['compressed'], 'thumb.webp', { type: 'image/webp' });
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ url: 'https://example.com/uploaded-thumb.png' }),
      ok: true,
    } as Response);
    vi.mocked(optimizeThumbnailImageFile).mockResolvedValue(optimizedFile);

    renderPublishPanel();

    const fileInput = screen.getByLabelText('파일 업로드') as HTMLInputElement;

    const file = new File(['binary'], 'thumb.png', { type: 'image/png' });
    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByLabelText('썸네일')).toHaveValue('https://example.com/uploaded-thumb.png');
      expect(screen.getByAltText('썸네일 미리보기')).toHaveAttribute(
        'src',
        'https://example.com/uploaded-thumb.png',
      );
    });

    expect(optimizeThumbnailImageFile).toHaveBeenCalledWith(file);

    const formData = fetchSpy.mock.calls[0]?.[1]?.body as FormData;
    expect(formData.get('imageKind')).toBe('thumbnail');
    expect(formData.get('file')).toBe(optimizedFile);
  });

  it('제출 중에는 버튼을 비활성화하고 완료 후 닫는다', async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveSubmit = resolve;
        }),
    );

    mockSlugCheckResponse(false);
    const { onClose } = renderPublishPanel({ onSubmit });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '발행하기' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { hidden: true, name: '사용 가능 확인' }));
    await screen.findByText('사용 가능한 슬러그입니다.');
    fireEvent.click(screen.getByRole('button', { hidden: true, name: '발행하기' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /발행 중/ })).toBeDisabled();
    });

    if (!resolveSubmit) {
      throw new Error('submit resolver not set');
    }

    resolveSubmit();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('publish 중 slug 중복 에러가 오면 인라인 에러로 표시한다', async () => {
    const onSubmit = vi.fn().mockRejectedValue(createEditorError('duplicateSlug'));

    mockSlugCheckResponse(false);
    renderPublishPanel({ onSubmit });

    fireEvent.click(screen.getByRole('button', { hidden: true, name: '사용 가능 확인' }));
    await screen.findByText('사용 가능한 슬러그입니다.');
    fireEvent.click(screen.getByRole('button', { hidden: true, name: '발행하기' }));

    expect(await screen.findByText(EDITOR_ERROR_MESSAGE.duplicateSlug)).toBeTruthy();
    expect(screen.queryByText(EDITOR_ERROR_MESSAGE.publishFailed)).toBeNull();
  });

  it('publish 중 일반 서버 오류가 오면 toast로 표시한다', async () => {
    const onSubmit = vi.fn().mockRejectedValue(createEditorError('publishFailed'));

    mockSlugCheckResponse(false);
    renderPublishPanel({ onSubmit });

    fireEvent.click(screen.getByRole('button', { hidden: true, name: '사용 가능 확인' }));
    await screen.findByText('사용 가능한 슬러그입니다.');
    fireEvent.click(screen.getByRole('button', { hidden: true, name: '발행하기' }));

    expect(await screen.findByText(EDITOR_ERROR_MESSAGE.publishFailed)).toBeTruthy();
  });
});
