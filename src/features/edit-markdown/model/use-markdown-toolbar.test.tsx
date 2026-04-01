import { cleanup, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { useMarkdownToolbar } from '@/features/edit-markdown/model/use-markdown-toolbar';

/**
 * hook이 만든 action 목록에서 label로 일반 toolbar action을 찾습니다.
 */
const getToolbarActionByLabel = (
  toolbarSections: ReturnType<typeof useMarkdownToolbar>['toolbarSections'],
  label: string,
) => {
  for (const section of toolbarSections) {
    for (const item of section.items) {
      if (item.type === 'action' && item.action.label === label) {
        return item.action;
      }
    }
  }

  throw new Error(`toolbar action not found: ${label}`);
};

/**
 * hook이 만든 custom toolbar item 안에서 token popover option을 label로 찾습니다.
 */
const getToolbarTokenOptionByLabel = (
  toolbarSections: ReturnType<typeof useMarkdownToolbar>['toolbarSections'],
  label: string,
) => {
  for (const section of toolbarSections) {
    for (const item of section.items) {
      if (!item || item.type !== 'custom' || !React.isValidElement(item.node)) continue;

      const options = (
        item.node.props as { options?: Array<{ label: string; onClick: () => void }> }
      ).options;

      const matchedOption = options?.find(option => option.label === label);
      if (matchedOption) {
        return matchedOption;
      }
    }
  }

  throw new Error(`toolbar token option not found: ${label}`);
};

/**
 * textarea ref와 onChange를 연결한 markdown toolbar hook 테스트 환경을 만듭니다.
 */
const renderMarkdownToolbarHook = () => {
  const textarea = document.createElement('textarea');
  document.body.append(textarea);

  const textareaRef = { current: textarea };
  const onChange = vi.fn((nextValue: string) => {
    textarea.value = nextValue;
  });

  const hook = renderHook(() =>
    useMarkdownToolbar({
      contentType: 'article',
      onChange,
      popoverTriggerClassName: '',
      textareaRef,
    }),
  );

  return {
    ...hook,
    onChange,
    textarea,
  };
};

describe('useMarkdownToolbar', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('굵게 action은 선택한 텍스트를 감싼다', async () => {
    const { result, textarea } = renderMarkdownToolbarHook();

    textarea.value = 'OpenAI';
    textarea.setSelectionRange(0, 6);

    getToolbarActionByLabel(result.current.toolbarSections, '굵게').onClick();

    await waitFor(() => {
      expect(textarea.value).toBe('**OpenAI**');
      expect(textarea.selectionStart).toBe(2);
      expect(textarea.selectionEnd).toBe(8);
    });
  });

  it('제목 action은 같은 레벨이면 제거하고 빈 줄이면 prefix만 삽입한다', async () => {
    const { result, textarea } = renderMarkdownToolbarHook();

    textarea.value = '## 제목';
    textarea.setSelectionRange(0, textarea.value.length);

    getToolbarTokenOptionByLabel(result.current.toolbarSections, '제목 3').onClick();

    await waitFor(() => {
      expect(textarea.value).toBe('### 제목');
    });

    textarea.setSelectionRange(0, textarea.value.length);
    getToolbarTokenOptionByLabel(result.current.toolbarSections, '제목 3').onClick();

    await waitFor(() => {
      expect(textarea.value).toBe('제목');
    });

    textarea.value = '';
    textarea.setSelectionRange(0, 0);
    getToolbarTokenOptionByLabel(result.current.toolbarSections, '제목 4').onClick();

    await waitFor(() => {
      expect(textarea.value).toBe('#### ');
      expect(textarea.selectionStart).toBe(5);
      expect(textarea.selectionEnd).toBe(5);
    });
  });

  it('코드 블록 action은 placeholder를 삽입하고 코드 영역을 선택한다', async () => {
    const { result, textarea } = renderMarkdownToolbarHook();

    getToolbarActionByLabel(result.current.toolbarSections, '코드 블록').onClick();

    await waitFor(() => {
      expect(textarea.value).toBe('```ts\n코드를 입력하세요\n```');
      expect(textarea.selectionStart).toBe(6);
      expect(textarea.selectionEnd).toBe(15);
    });
  });

  it('토글 action은 빈 상태에서도 토글 템플릿을 삽입한다', async () => {
    const { result, textarea } = renderMarkdownToolbarHook();

    getToolbarTokenOptionByLabel(result.current.toolbarSections, '토글 제목 4').onClick();

    await waitFor(() => {
      expect(textarea.value).toContain(':::toggle #### ');
      expect(textarea.value).toContain('\n:::');
    });
  });
});
