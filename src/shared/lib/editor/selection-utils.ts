const pendingSelectionStartKey = 'selectionUtilsPendingStart';
const pendingSelectionEndKey = 'selectionUtilsPendingEnd';

type TextareaValueChangeHandler = (value: string) => void;
type TextareaValueTransform = (textarea: HTMLTextAreaElement) => string;

/**
 * 다음 렌더 이후 복원할 선택 범위를 textarea dataset에 기록합니다.
 */
const setPendingSelection = (textarea: HTMLTextAreaElement, start: number, end: number) => {
  textarea.dataset[pendingSelectionStartKey] = String(start);
  textarea.dataset[pendingSelectionEndKey] = String(end);
};

/**
 * 선택 범위와 줄 경계를 기준으로 prefix 토글 대상 블록을 계산합니다.
 */
const getSelectedLineRange = (textarea: HTMLTextAreaElement) => {
  const { selectionEnd, selectionStart, value } = textarea;
  const lineStart = value.lastIndexOf('\n', Math.max(selectionStart - 1, 0)) + 1;
  const nextLineBreakIndex = value.indexOf('\n', selectionEnd);
  const lineEnd = nextLineBreakIndex === -1 ? value.length : nextLineBreakIndex;

  return {
    lineEnd,
    lineStart,
    text: value.slice(lineStart, lineEnd),
  };
};

/**
 * 선택된 줄이 모두 같은 heading 레벨인지 판별할 때 사용할 공통 정규식입니다.
 */
const headingPrefixPattern = /^(#{1,6})\s+/;

/**
 * 선택 텍스트를 before/after 문자열로 감싸고, 다음 선택 범위를 기억합니다.
 * 선택이 없으면 placeholder를 삽입하고 placeholder 구간을 선택합니다.
 */
export const wrapSelection = (
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder = '텍스트',
) => {
  const { selectionEnd, selectionStart, value } = textarea;
  const selectedText = value.slice(selectionStart, selectionEnd);
  const nextSelectionText = selectedText || placeholder;
  const nextValue = [
    value.slice(0, selectionStart),
    before,
    nextSelectionText,
    after,
    value.slice(selectionEnd),
  ].join('');
  const nextStart = selectionStart + before.length;
  const nextEnd = nextStart + nextSelectionText.length;

  setPendingSelection(textarea, nextStart, nextEnd);

  return nextValue;
};

/**
 * 현재 선택된 줄마다 prefix를 붙이거나, 이미 모두 붙어 있으면 제거합니다.
 * 비어 있는 줄은 그대로 두고 나머지 줄만 토글합니다.
 */
export const prefixLine = (textarea: HTMLTextAreaElement, prefix: string) => {
  const { lineEnd, lineStart, text } = getSelectedLineRange(textarea);
  const lines = text.split('\n');
  const nonEmptyLines = lines.filter(line => line.length > 0);
  const shouldRemovePrefix =
    nonEmptyLines.length > 0 && nonEmptyLines.every(line => line.startsWith(prefix));
  const nextLines = lines.map(line => {
    if (line.length === 0) return line;

    if (shouldRemovePrefix) {
      return line.startsWith(prefix) ? line.slice(prefix.length) : line;
    }

    return line.startsWith(prefix) ? line : `${prefix}${line}`;
  });
  const nextBlock = nextLines.join('\n');
  const nextValue = [
    textarea.value.slice(0, lineStart),
    nextBlock,
    textarea.value.slice(lineEnd),
  ].join('');

  setPendingSelection(textarea, lineStart, lineStart + nextBlock.length);

  return nextValue;
};

/**
 * 커서 위치 또는 현재 선택 범위를 template으로 치환하고, cursorOffset 위치에 커서를 둡니다.
 */
export const insertTemplate = (
  textarea: HTMLTextAreaElement,
  template: string,
  cursorOffset = template.length,
) => {
  const { selectionEnd, selectionStart, value } = textarea;
  const nextValue = [value.slice(0, selectionStart), template, value.slice(selectionEnd)].join('');
  const nextCursor = selectionStart + cursorOffset;

  setPendingSelection(textarea, nextCursor, nextCursor);

  return nextValue;
};

/**
 * setState 이후 DOM에 반영된 textarea에 선택 범위를 다시 적용합니다.
 * 저장된 pending selection 정보가 있으면 함께 정리합니다.
 */
export const restoreCursor = (textarea: HTMLTextAreaElement, start: number, end: number) => {
  const maxIndex = textarea.value.length;
  const nextStart = Math.max(0, Math.min(start, maxIndex));
  const nextEnd = Math.max(nextStart, Math.min(end, maxIndex));

  textarea.setSelectionRange(nextStart, nextEnd);
  delete textarea.dataset[pendingSelectionStartKey];
  delete textarea.dataset[pendingSelectionEndKey];
};

/**
 * 툴바 버튼 클릭 뒤 textarea에 포커스를 되돌립니다.
 * 스크롤 점프를 줄이기 위해 preventScroll 옵션을 우선 사용합니다.
 */
export const focusTextarea = (textarea: HTMLTextAreaElement) => {
  textarea.focus({ preventScroll: true });
};

/**
 * 다음 렌더 이후 복원할 선택 범위를 읽습니다.
 * 툴바 액션에서 내부 상태처럼 사용하기 위한 보조 함수입니다.
 */
export const getPendingSelection = (textarea: HTMLTextAreaElement) => {
  const start = Number(textarea.dataset[pendingSelectionStartKey]);
  const end = Number(textarea.dataset[pendingSelectionEndKey]);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return {
      end: textarea.selectionEnd,
      start: textarea.selectionStart,
    };
  }

  return { end, start };
};

/**
 * textarea 변환 함수를 실행하고, 상태 반영 직후 포커스와 선택 범위를 복원합니다.
 * 툴바와 paste 처리처럼 "값 계산 + onChange + 커서 복원" 흐름을 한 곳으로 모읍니다.
 */
export const applyTextareaTransform = (
  textarea: HTMLTextAreaElement,
  onChange: TextareaValueChangeHandler,
  transform: TextareaValueTransform,
) => {
  const nextValue = transform(textarea);

  onChange(nextValue);

  queueMicrotask(() => {
    const pendingSelection = getPendingSelection(textarea);
    focusTextarea(textarea);
    restoreCursor(textarea, pendingSelection.start, pendingSelection.end);
  });

  return nextValue;
};

/**
 * 선택된 줄을 특정 heading 레벨로 토글합니다.
 * 같은 레벨이면 제거하고, 다른 heading 레벨이면 새 레벨로 치환합니다.
 */
export const toggleHeadingLine = (textarea: HTMLTextAreaElement, level: 1 | 2 | 3 | 4) => {
  const { lineEnd, lineStart, text } = getSelectedLineRange(textarea);
  const lines = text.split('\n');
  const targetPrefix = `${'#'.repeat(level)} `;
  if (lines.length === 1 && lines[0].trim().length === 0) {
    const nextValue = [
      textarea.value.slice(0, lineStart),
      targetPrefix,
      textarea.value.slice(lineEnd),
    ].join('');

    setPendingSelection(textarea, lineStart + targetPrefix.length, lineStart + targetPrefix.length);

    return nextValue;
  }

  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  const shouldRemoveTargetPrefix =
    nonEmptyLines.length > 0 && nonEmptyLines.every(line => line.startsWith(targetPrefix));
  const nextLines = lines.map(line => {
    if (line.trim().length === 0) return line;

    if (shouldRemoveTargetPrefix) {
      return line.startsWith(targetPrefix) ? line.slice(targetPrefix.length) : line;
    }

    const withoutHeadingPrefix = line.replace(headingPrefixPattern, '');

    return `${targetPrefix}${withoutHeadingPrefix}`;
  });
  const nextBlock = nextLines.join('\n');
  const nextValue = [
    textarea.value.slice(0, lineStart),
    nextBlock,
    textarea.value.slice(lineEnd),
  ].join('');

  setPendingSelection(textarea, lineStart, lineStart + nextBlock.length);

  return nextValue;
};
