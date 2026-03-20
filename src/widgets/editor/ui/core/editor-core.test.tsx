import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';

import { EditorCore } from '@/widgets/editor';

import '@testing-library/jest-dom/vitest';

type MatchMediaController = {
  setMatches: (matches: boolean) => void;
};

/**
 * 모바일 media query를 제어할 수 있는 간단한 테스트용 matchMedia mock입니다.
 */
const installMatchMediaMock = (initialMatches: boolean): MatchMediaController => {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      addEventListener: (_eventName: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      get matches() {
        return matches;
      },
      media: '(max-width: 760px)',
      removeEventListener: (_eventName: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
    })),
  });

  return {
    setMatches: nextMatches => {
      matches = nextMatches;
      listeners.forEach(listener =>
        listener({ matches: nextMatches, media: '(max-width: 760px)' } as MediaQueryListEvent),
      );
    },
  };
};

/**
 * 현재 locale tabpanel 안의 제목 input을 가져옵니다.
 */
const getTitleInput = (localeLabel: 'EN' | 'FR' | 'JA' | 'KO') =>
  within(screen.getByRole('tabpanel', { name: localeLabel })).getByRole('textbox', {
    name: '제목',
  });

const availableTags = [
  { id: 'tag-1', label: '리액트', slug: 'react' },
  { id: 'tag-2', label: '넥스트', slug: 'nextjs' },
];

/**
 * 공용 EditorCore를 테스트 기본값과 함께 렌더링합니다.
 */
const renderEditorCore = (options?: {
  initialTranslations?: React.ComponentProps<typeof EditorCore>['initialTranslations'];
  initialSavedAt?: string | null;
  onDraftSave?: (
    state: Parameters<NonNullable<React.ComponentProps<typeof EditorCore>['onDraftSave']>>[0],
  ) => Promise<void>;
  onOpenPublishPanel?: React.ComponentProps<typeof EditorCore>['onOpenPublishPanel'];
}) => {
  const onDraftSave = options?.onDraftSave ?? vi.fn().mockResolvedValue(undefined);
  const onOpenPublishPanel = options?.onOpenPublishPanel ?? vi.fn();

  render(
    <EditorCore
      availableTags={availableTags}
      contentType="article"
      initialPublished={false}
      initialSavedAt={options?.initialSavedAt ?? null}
      initialSlug=""
      initialTags={[]}
      initialTranslations={
        options?.initialTranslations ?? {
          en: { content: '', description: '', title: '' },
          fr: { content: '', description: '', title: '' },
          ja: { content: '', description: '', title: '' },
          ko: { content: '', description: '', title: '' },
        }
      }
      onDraftSave={onDraftSave}
      onOpenPublishPanel={onOpenPublishPanel}
    />,
  );

  return {
    onDraftSave,
    onOpenPublishPanel,
  };
};

describe('EditorCore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    installMatchMediaMock(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('locale 탭 전환 시 제목과 본문 상태가 서로 섞이지 않는다', async () => {
    renderEditorCore();

    fireEvent.change(getTitleInput('KO'), {
      target: { value: '한국어 제목' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '본문 입력' }), {
      target: { value: '한국어 본문' },
    });

    fireEvent.click(screen.getByRole('tab', { name: 'EN' }));
    fireEvent.change(getTitleInput('EN'), {
      target: { value: 'English title' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '본문 입력' }), {
      target: { value: 'English body' },
    });

    fireEvent.click(screen.getByRole('tab', { name: 'KO' }));

    await waitFor(() => {
      expect(getTitleInput('KO')).toHaveValue('한국어 제목');
      expect(screen.getByRole('textbox', { name: '본문 입력' })).toHaveValue('한국어 본문');
    });

    fireEvent.click(screen.getByRole('tab', { name: 'EN' }));

    await waitFor(() => {
      expect(getTitleInput('EN')).toHaveValue('English title');
      expect(screen.getByRole('textbox', { name: '본문 입력' })).toHaveValue('English body');
    });
  });

  it('locale별 textarea scroll 위치를 따로 보존한다', async () => {
    renderEditorCore();

    const koTextarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    Object.defineProperty(koTextarea, 'scrollTop', {
      configurable: true,
      value: 120,
      writable: true,
    });
    fireEvent.scroll(koTextarea);

    fireEvent.click(screen.getByRole('tab', { name: 'EN' }));

    const enTextarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    Object.defineProperty(enTextarea, 'scrollTop', {
      configurable: true,
      value: 48,
      writable: true,
    });
    fireEvent.scroll(enTextarea);

    fireEvent.click(screen.getByRole('tab', { name: 'KO' }));

    await waitFor(() => {
      expect(
        (screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement).scrollTop,
      ).toBe(120);
    });
  });

  it('내용이 있는데 제목이 비어 있으면 인라인 에러를 노출한다', async () => {
    renderEditorCore();

    fireEvent.change(screen.getByRole('textbox', { name: '본문 입력' }), {
      target: { value: '내용만 있음' },
    });

    expect(await screen.findByText('제목을 입력해주세요')).toBeTruthy();
  });

  it('모바일에서는 편집과 미리보기 탭을 전환한다', async () => {
    installMatchMediaMock(true);
    renderEditorCore();

    expect(screen.getByRole('tab', { name: '편집' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: '미리보기' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: '본문 입력' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: '본문 미리보기' })).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: '미리보기' }));

    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: '본문 입력' })).toBeNull();
      expect(screen.getByRole('tab', { name: '미리보기' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
  });

  it('데스크톱에서는 편집 pane과 미리보기 pane을 동시에 렌더링한다', () => {
    renderEditorCore();

    expect(screen.getByRole('region', { name: '본문 편집' })).toBeTruthy();
    expect(screen.getByRole('region', { name: '본문 미리보기' })).toBeTruthy();
  });

  it('숨겨진 locale panel의 제목과 설명도 탭 전환 시 높이를 다시 계산한다', async () => {
    renderEditorCore({
      initialTranslations: {
        en: {
          content: '',
          description: '영문 설명이 두 줄로 보이도록 충분히 길게 들어갑니다.',
          title: 'English title that should expand after the tab becomes visible.',
        },
        fr: { content: '', description: '', title: '' },
        ja: { content: '', description: '', title: '' },
        ko: { content: '', description: '', title: '' },
      },
    });

    const enTitleTextarea = document.getElementById('editor-title-en') as HTMLTextAreaElement;
    const enDescriptionTextarea = document.getElementById(
      'editor-description-en',
    ) as HTMLTextAreaElement;

    Object.defineProperty(enTitleTextarea, 'scrollHeight', {
      configurable: true,
      value: 92,
    });
    Object.defineProperty(enDescriptionTextarea, 'scrollHeight', {
      configurable: true,
      value: 76,
    });

    fireEvent.click(screen.getByRole('tab', { name: 'EN' }));

    await waitFor(() => {
      expect(enTitleTextarea.style.height).toBe('92px');
      expect(enDescriptionTextarea.style.height).toBe('76px');
    });
  });

  it('toolbar는 active locale textarea에만 값을 적용한다', async () => {
    renderEditorCore();

    fireEvent.click(screen.getByRole('tab', { name: 'EN' }));

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'OpenAI' } });
    textarea.setSelectionRange(0, 6);

    fireEvent.click(screen.getByRole('button', { name: '굵게' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: '본문 입력' })).toHaveValue('**OpenAI**');
    });

    fireEvent.click(screen.getByRole('tab', { name: 'KO' }));

    expect(screen.getByRole('textbox', { name: '본문 입력' })).toHaveValue('');
  });

  it('수동 저장 시 현재 EditorState snapshot을 전달한다', async () => {
    const onDraftSave = vi.fn().mockResolvedValue(undefined);

    renderEditorCore({ onDraftSave });

    fireEvent.change(getTitleInput('KO'), {
      target: { value: '저장 제목' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '본문 입력' }), {
      target: { value: '저장 본문' },
    });
    fireEvent.click(screen.getByRole('button', { name: '리액트 태그 선택' }));

    fireEvent.click(screen.getByRole('button', { name: '임시저장' }));

    await waitFor(() => {
      expect(onDraftSave).toHaveBeenCalledWith({
        dirty: true,
        slug: '',
        tags: ['react'],
        translations: {
          en: { content: '', description: '', download_button_label: '', title: '' },
          fr: { content: '', description: '', download_button_label: '', title: '' },
          ja: { content: '', description: '', download_button_label: '', title: '' },
          ko: {
            content: '저장 본문',
            description: '',
            download_button_label: '',
            title: '저장 제목',
          },
        },
      });
    });
  });

  it('autosave는 마지막 입력 후 180초 뒤 한 번만 실행된다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-12T09:07:00+09:00'));
    const onDraftSave = vi.fn().mockResolvedValue(undefined);

    renderEditorCore({ onDraftSave });

    fireEvent.change(getTitleInput('KO'), {
      target: { value: 'autosave title' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '본문 입력' }), {
      target: { value: 'autosave body' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(179_999);
    });
    expect(onDraftSave).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(onDraftSave).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('저장됨 09:10');
  });

  it('저장 실패 시 토스트를 띄우고 dirty 상태를 유지한다', async () => {
    const onDraftSave = vi.fn().mockRejectedValue(new Error('save failed'));

    renderEditorCore({ onDraftSave });

    fireEvent.change(getTitleInput('KO'), {
      target: { value: '실패 제목' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '본문 입력' }), {
      target: { value: '실패 본문' },
    });
    fireEvent.click(screen.getByRole('button', { name: '임시저장' }));

    expect(
      await screen.findByText('임시 저장에 실패했습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeTruthy();
    expect(screen.getByRole('status')).toHaveTextContent('변경사항 있음');
  });

  it('dirty 상태에서 beforeunload 경고를 설정한다', async () => {
    renderEditorCore();

    fireEvent.change(getTitleInput('KO'), {
      target: { value: 'changed-title' },
    });

    const beforeUnloadEvent = new Event('beforeunload', { cancelable: true });

    act(() => {
      window.dispatchEvent(beforeUnloadEvent);
    });

    expect(beforeUnloadEvent.defaultPrevented).toBe(true);
  });

  it('발행하기 버튼은 dirty 여부와 관계없이 현재 상태를 전달한다', async () => {
    const onOpenPublishPanel = vi.fn();

    renderEditorCore({ onOpenPublishPanel });

    fireEvent.click(screen.getByRole('button', { name: '발행하기' }));
    expect(onOpenPublishPanel).toHaveBeenCalledWith({
      dirty: false,
      slug: '',
      tags: [],
      translations: {
        en: { content: '', description: '', download_button_label: '', title: '' },
        fr: { content: '', description: '', download_button_label: '', title: '' },
        ja: { content: '', description: '', download_button_label: '', title: '' },
        ko: { content: '', description: '', download_button_label: '', title: '' },
      },
    });

    fireEvent.change(getTitleInput('KO'), {
      target: { value: 'publish-title' },
    });
    fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

    expect(onOpenPublishPanel).toHaveBeenLastCalledWith({
      dirty: true,
      slug: '',
      tags: [],
      translations: {
        en: { content: '', description: '', download_button_label: '', title: '' },
        fr: { content: '', description: '', download_button_label: '', title: '' },
        ja: { content: '', description: '', download_button_label: '', title: '' },
        ko: {
          content: '',
          description: '',
          download_button_label: '',
          title: 'publish-title',
        },
      },
    });
  });
});
