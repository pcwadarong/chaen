import {
  focusTextarea,
  getPendingSelection,
  insertTemplate,
  prefixLine,
  restoreCursor,
  toggleHeadingLine,
  wrapSelection,
} from './selection-utils';

/**
 * 테스트용 textarea를 만들고 value/selection 상태를 초기화합니다.
 */
const createTextarea = (value: string, selectionStart: number, selectionEnd = selectionStart) => {
  const textarea = document.createElement('textarea');

  textarea.value = value;
  textarea.setSelectionRange(selectionStart, selectionEnd);

  return textarea;
};

describe('selection utils', () => {
  it('선택된 텍스트를 감싸고 감싼 내부 텍스트를 다시 선택한다', () => {
    const textarea = createTextarea('OpenAI', 0, 6);

    const nextValue = wrapSelection(textarea, '**', '**', '굵은 텍스트');

    expect(nextValue).toBe('**OpenAI**');
    expect(getPendingSelection(textarea)).toEqual({
      end: 8,
      start: 2,
    });
  });

  it('선택이 없으면 placeholder를 삽입하고 placeholder 범위를 선택한다', () => {
    const textarea = createTextarea('', 0);

    const nextValue = wrapSelection(textarea, '*', '*', '기울임');

    expect(nextValue).toBe('*기울임*');
    expect(getPendingSelection(textarea)).toEqual({
      end: 4,
      start: 1,
    });
  });

  it('여러 줄 prefix가 모두 있으면 제거하고 아니면 각 줄 앞에 추가한다', () => {
    const textarea = createTextarea('첫 줄\n둘째 줄', 1, 7);

    const addedValue = prefixLine(textarea, '> ');

    expect(addedValue).toBe('> 첫 줄\n> 둘째 줄');
    expect(getPendingSelection(textarea)).toEqual({
      end: 12,
      start: 0,
    });

    textarea.value = addedValue;
    textarea.setSelectionRange(0, addedValue.length);

    const removedValue = prefixLine(textarea, '> ');

    expect(removedValue).toBe('첫 줄\n둘째 줄');
  });

  it('template을 삽입하고 지정한 offset 위치로 커서를 이동한다', () => {
    const textarea = createTextarea('abc', 1, 2);

    const nextValue = insertTemplate(textarea, '```ts\n코드를 입력하세요\n```', 6);

    expect(nextValue).toBe('a```ts\n코드를 입력하세요\n```c');
    expect(getPendingSelection(textarea)).toEqual({
      end: 7,
      start: 7,
    });
  });

  it('heading 토글은 같은 레벨이면 제거하고 다른 레벨이면 치환한다', () => {
    const textarea = createTextarea('## 제목\n본문', 0, 8);

    const upgradedValue = toggleHeadingLine(textarea, 3);

    expect(upgradedValue).toBe('### 제목\n### 본문');

    textarea.value = upgradedValue;
    textarea.setSelectionRange(0, upgradedValue.length);

    const removedValue = toggleHeadingLine(textarea, 3);

    expect(removedValue).toBe('제목\n본문');
  });

  it('restoreCursor는 다음 value 길이에 맞게 선택 범위를 복원한다', () => {
    const textarea = createTextarea('초기값', 0);

    textarea.value = '**강조**';
    restoreCursor(textarea, 2, 4);

    expect(textarea.selectionStart).toBe(2);
    expect(textarea.selectionEnd).toBe(4);
  });

  it('focusTextarea는 textarea에 포커스를 되돌린다', () => {
    const textarea = createTextarea('본문', 0);
    document.body.append(textarea);

    focusTextarea(textarea);

    expect(document.activeElement).toBe(textarea);
    textarea.remove();
  });
});
