const htmlLineBreakPattern = /<br\s*\/?>/gi;
const htmlHorizontalRulePattern = /<hr\s*\/?>/gi;
const markdownLineBreakPlaceholder = '__MD_LINE_BREAK__';
const markdownHorizontalRulePlaceholder = '__MD_HORIZONTAL_RULE__';
const inlineStyledSpanPattern = /<span style="([^"]+)">([\s\S]*?)<\/span>/g;
const inlineUnderlinePattern = /<u>([\s\S]*?)<\/u>/g;
const inlineSpoilerPattern = /\|\|([^|]+?)\|\|/g;
const inlineMathPattern = /<Math>([\s\S]*?)<\/Math>/g;
const fenceBoundaryPattern = /^\s*(`{3,}|~{3,})/;

type FenceState = {
  delimiter: '`' | '~';
  size: number;
} | null;

/**
 * 현재 줄이 fenced code block의 열기/닫기 경계인지 판별합니다.
 *
 * @param line 현재 검사 중인 markdown 한 줄입니다.
 * @param activeFence 현재 활성화된 fence 상태입니다.
 * @returns fence 경계 정보 또는 null을 반환합니다.
 */
const getFenceBoundary = (line: string, activeFence: FenceState) => {
  const match = line.match(fenceBoundaryPattern);

  if (!match) return null;

  const delimiter = match[1][0] as '`' | '~';
  const size = match[1].length;

  if (!activeFence) {
    return {
      delimiter,
      size,
    };
  }

  if (activeFence.delimiter !== delimiter || size < activeFence.size) {
    return null;
  }

  return {
    delimiter,
    size,
  };
};

/**
 * fenced code block/inline code를 제외한 일반 텍스트 구간에만 transform을 적용합니다.
 *
 * @param markdown 원본 markdown 문자열입니다.
 * @param transform 코드 바깥 prose 문자열에 적용할 변환 함수입니다.
 * @returns 코드 구간을 보존한 채 prose만 변환한 markdown 문자열입니다.
 */
export const transformMarkdownOutsideCode = (
  markdown: string,
  transform: (value: string) => string,
) => {
  const lines = markdown.split('\n');
  let activeFence: FenceState = null;

  return lines
    .map(line => {
      const fenceBoundary = getFenceBoundary(line, activeFence);

      if (fenceBoundary) {
        activeFence = activeFence ? null : fenceBoundary;
        return line;
      }

      if (activeFence) {
        return line;
      }

      let transformedLine = '';

      for (let cursor = 0; cursor < line.length; ) {
        if (line[cursor] !== '`') {
          const nextBacktickIndex = line.indexOf('`', cursor);
          const proseSegment = line.slice(
            cursor,
            nextBacktickIndex === -1 ? line.length : nextBacktickIndex,
          );

          transformedLine += transform(proseSegment);
          cursor = nextBacktickIndex === -1 ? line.length : nextBacktickIndex;
          continue;
        }

        let tickCount = 1;

        while (line[cursor + tickCount] === '`') {
          tickCount += 1;
        }

        const delimiter = '`'.repeat(tickCount);
        const codeStart = cursor;
        const codeEnd = line.indexOf(delimiter, cursor + tickCount);

        if (codeEnd === -1) {
          transformedLine += transform(line.slice(cursor));
          break;
        }

        transformedLine += line.slice(codeStart, codeEnd + tickCount);
        cursor = codeEnd + tickCount;
      }

      return transformedLine;
    })
    .join('\n');
};

/**
 * markdown 링크 라벨 안에서 깨질 수 있는 문자만 최소 범위로 escape합니다.
 *
 * @param value inline directive 라벨에 넣을 텍스트입니다.
 * @returns markdown 링크 라벨에서 안전하게 쓸 수 있는 문자열입니다.
 */
const escapeMarkdownLinkLabel = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]');

/**
 * span style 문자열에서 color/background-color hex 값을 추출합니다.
 *
 * @param style inline style 원본 문자열입니다.
 * @returns color/background-color hex 추출 결과입니다.
 */
const parseInlineStyle = (style: string) => {
  const declarations = style
    .split(';')
    .map(entry => entry.trim())
    .filter(Boolean);
  const styleMap = new Map<string, string>();

  declarations.forEach(entry => {
    const [property, rawValue] = entry.split(':');
    if (!property || !rawValue) return;

    styleMap.set(property.trim().toLowerCase(), rawValue.trim());
  });

  const color = styleMap.get('color');
  const background = styleMap.get('background-color');
  const colorHex = color?.match(/^#[0-9A-Fa-f]{6}$/)?.[0];
  const backgroundHex = background?.match(/^#[0-9A-Fa-f]{6}$/)?.[0];

  return {
    backgroundHex,
    colorHex,
  };
};

/**
 * 커스텀 인라인 문법을 react-markdown이 처리할 수 있는 특수 링크로 치환합니다.
 *
 * @param markdown 원본 markdown 문자열입니다.
 * @returns react-markdown inline directive 해석이 가능한 markdown 문자열입니다.
 */
export const preprocessMarkdownInlineSyntax = (markdown: string) =>
  transformMarkdownOutsideCode(markdown, value =>
    value
      .replace(inlineStyledSpanPattern, (_, rawStyle: string, text: string) => {
        const escapedText = escapeMarkdownLinkLabel(text.trim() || '텍스트');
        const { backgroundHex, colorHex } = parseInlineStyle(rawStyle);

        if (backgroundHex && colorHex) {
          return `[${escapedText}](#md-style:color=${colorHex};background=${backgroundHex})`;
        }

        if (backgroundHex) {
          return `[${escapedText}](#md-bg:${backgroundHex})`;
        }

        if (colorHex) {
          return `[${escapedText}](#md-color:${colorHex})`;
        }

        return text;
      })
      .replace(inlineUnderlinePattern, (_, text: string) => {
        const escapedText = escapeMarkdownLinkLabel(text.trim() || '텍스트');

        return `[${escapedText}](#md-underline:)`;
      })
      .replace(inlineSpoilerPattern, (_, text: string) => {
        const escapedText = escapeMarkdownLinkLabel(text.trim() || '스포일러');

        return `[${escapedText}](#md-spoiler:)`;
      })
      .replace(inlineMathPattern, (_, formula: string) => {
        const normalizedFormula = formula.trim();
        const encodedFormula = encodeURIComponent(normalizedFormula);
        const escapedLabel = escapeMarkdownLinkLabel(normalizedFormula || 'math');

        return `[${escapedLabel}](#md-math:${encodedFormula})`;
      }),
  );

/**
 * raw HTML로 적힌 기본 line-break/hr 문법을 markdown equivalent로 정규화합니다.
 * 현재 renderer는 rehype-raw를 쓰지 않으므로 이 단계에서 먼저 치환합니다.
 *
 * @param markdown 원본 markdown 문자열입니다.
 * @returns HTML alias가 markdown equivalent로 치환된 문자열입니다.
 */
export const normalizeMarkdownHtmlAliases = (markdown: string) =>
  transformMarkdownOutsideCode(markdown, value =>
    value
      .replace(htmlHorizontalRulePattern, markdownHorizontalRulePlaceholder)
      .replace(htmlLineBreakPattern, markdownLineBreakPlaceholder),
  )
    .replace(new RegExp(markdownLineBreakPlaceholder, 'g'), '  \n')
    .replace(
      new RegExp(`(^|\n)${markdownHorizontalRulePlaceholder}(?=\n|$)`, 'g'),
      (_, prefix: string) => `${prefix}---`,
    )
    .replace(new RegExp(markdownHorizontalRulePlaceholder, 'g'), '\n---\n');
