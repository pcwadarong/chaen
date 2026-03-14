import React, { Fragment, type ReactNode } from 'react';
import { css, cx } from 'styled-system/css';

import {
  markdownH1Class,
  markdownH2Class,
  markdownH3Class,
  markdownH4Class,
} from '@/shared/lib/markdown/markdown-config';
import { ChevronRightIcon } from '@/shared/ui/icons/app-icons';

type MarkdownFragmentRenderer = (markdown: string, key: string) => ReactNode;

type ToggleHeadingLevel = 1 | 2 | 3 | 4 | null;

type MarkdownSegment =
  | {
      markdown: string;
      type: 'markdown';
    }
  | {
      align: 'center' | 'left' | 'right';
      content: string;
      type: 'align';
    }
  | {
      content: string;
      type: 'subtext';
    }
  | {
      content: string;
      headingLevel: ToggleHeadingLevel;
      title: string;
      type: 'toggle';
    }
  | {
      type: 'youtube';
      videoId: string;
    };

const toggleStartPrefix = ':::toggle ';
const alignStartPattern = /^:::align (left|center|right)\s*$/;
const youtubePattern = /^<YouTube id="([^"]+)" \/>$/;
const subtextPrefix = '-# ';
const htmlLineBreakPattern = /<br\s*\/?>/gi;
const htmlHorizontalRulePattern = /<hr\s*\/?>/gi;
const markdownLineBreakPlaceholder = '__MD_LINE_BREAK__';
const markdownHorizontalRulePlaceholder = '__MD_HORIZONTAL_RULE__';
const inlineStyledSpanPattern = /<span style="([^"]+)">([\s\S]*?)<\/span>/g;
const inlineUnderlinePattern = /<u>([\s\S]*?)<\/u>/g;
const inlineSpoilerPattern = /\|\|([^|]+?)\|\|/g;
const fenceBoundaryPattern = /^\s*(`{3,}|~{3,})/;

type FenceState = {
  delimiter: '`' | '~';
  size: number;
} | null;

/**
 * 현재 줄이 fenced code block의 열기/닫기 경계인지 판별합니다.
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
 */
const transformMarkdownOutsideCode = (markdown: string, transform: (value: string) => string) => {
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
 */
const escapeMarkdownLinkLabel = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]');

/**
 * span style 문자열에서 color/background-color hex 값을 추출합니다.
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
      }),
  );

/**
 * raw HTML로 적힌 기본 line-break/hr 문법을 markdown equivalent로 정규화합니다.
 * 현재 renderer는 rehype-raw를 쓰지 않으므로 이 단계에서 먼저 치환합니다.
 */
const normalizeMarkdownHtmlAliases = (markdown: string) =>
  transformMarkdownOutsideCode(markdown, value =>
    value
      .replace(htmlHorizontalRulePattern, markdownHorizontalRulePlaceholder)
      .replace(htmlLineBreakPattern, markdownLineBreakPlaceholder),
  )
    .replace(new RegExp(`${markdownLineBreakPlaceholder}\n`, 'g'), '\n')
    .replace(new RegExp(markdownLineBreakPlaceholder, 'g'), '\n')
    .replace(
      new RegExp(`(^|\n)${markdownHorizontalRulePlaceholder}(?=\n|$)`, 'g'),
      (_, prefix: string) => `${prefix}---`,
    )
    .replace(new RegExp(markdownHorizontalRulePlaceholder, 'g'), '\n---\n');

/**
 * toggle summary 문자열 앞의 heading prefix를 읽어 summary 스타일 레벨과 본문 제목을 분리합니다.
 */
const parseToggleTitle = (rawTitle: string) => {
  const trimmedTitle = rawTitle.trim();
  const headingMatch = trimmedTitle.match(/^(#{1,4})(?:\s+(.*))?$/);
  const fallbackTitle = 'Untitled toggle';

  if (!trimmedTitle) {
    return {
      headingLevel: null,
      title: fallbackTitle,
    };
  }

  if (!headingMatch) {
    return {
      headingLevel: null,
      title: trimmedTitle || fallbackTitle,
    };
  }

  return {
    headingLevel: headingMatch[1].length as ToggleHeadingLevel,
    title: headingMatch[2]?.trim() || fallbackTitle,
  };
};

/**
 * custom markdown block 문법을 일반 markdown chunk와 전용 block segment로 분리합니다.
 */
export const parseRichMarkdownSegments = (markdown: string): MarkdownSegment[] => {
  const lines = markdown.split('\n');
  const segments: MarkdownSegment[] = [];
  const currentMarkdownLines: string[] = [];
  let activeFence: FenceState = null;

  const flushMarkdown = () => {
    if (currentMarkdownLines.length === 0) return;

    segments.push({
      markdown: currentMarkdownLines.join('\n'),
      type: 'markdown',
    });
    currentMarkdownLines.length = 0;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceBoundary = getFenceBoundary(line, activeFence);

    if (fenceBoundary) {
      currentMarkdownLines.push(line);
      activeFence = activeFence ? null : fenceBoundary;
      continue;
    }

    if (activeFence) {
      currentMarkdownLines.push(line);
      continue;
    }

    if (line.startsWith(toggleStartPrefix)) {
      flushMarkdown();

      const bodyLines: string[] = [];
      let cursor = index + 1;

      while (cursor < lines.length && lines[cursor] !== ':::') {
        bodyLines.push(lines[cursor]);
        cursor += 1;
      }

      const { headingLevel, title } = parseToggleTitle(line.slice(toggleStartPrefix.length));

      segments.push({
        content: bodyLines.join('\n'),
        headingLevel,
        title,
        type: 'toggle',
      });

      index = cursor;
      continue;
    }

    const alignMatch = line.match(alignStartPattern);

    if (alignMatch) {
      flushMarkdown();

      const bodyLines: string[] = [];
      let cursor = index + 1;

      while (cursor < lines.length && lines[cursor] !== ':::') {
        bodyLines.push(lines[cursor]);
        cursor += 1;
      }

      segments.push({
        align: alignMatch[1] as 'center' | 'left' | 'right',
        content: bodyLines.join('\n'),
        type: 'align',
      });

      index = cursor;
      continue;
    }

    const youtubeMatch = line.match(youtubePattern);

    if (youtubeMatch) {
      flushMarkdown();
      segments.push({
        type: 'youtube',
        videoId: youtubeMatch[1],
      });
      continue;
    }

    if (line.startsWith(subtextPrefix)) {
      flushMarkdown();

      const subtextLines = [line.slice(subtextPrefix.length)];
      let cursor = index + 1;

      while (cursor < lines.length && lines[cursor].startsWith(subtextPrefix)) {
        subtextLines.push(lines[cursor].slice(subtextPrefix.length));
        cursor += 1;
      }

      segments.push({
        content: subtextLines.join('\n'),
        type: 'subtext',
      });

      index = cursor - 1;
      continue;
    }

    currentMarkdownLines.push(line);
  }

  flushMarkdown();

  return segments;
};

/**
 * custom markdown segment와 일반 markdown fragment를 합쳐 최종 React 노드 목록으로 변환합니다.
 */
export const renderRichMarkdown = ({
  markdown,
  renderMarkdownFragment,
}: {
  markdown: string;
  renderMarkdownFragment: MarkdownFragmentRenderer;
}) =>
  parseRichMarkdownSegments(normalizeMarkdownHtmlAliases(markdown)).map((segment, index) => {
    const key = `rich-markdown-${index}`;

    if (segment.type === 'markdown') {
      return (
        <Fragment key={key}>
          {renderMarkdownFragment(preprocessMarkdownInlineSyntax(segment.markdown), key)}
        </Fragment>
      );
    }

    if (segment.type === 'youtube') {
      return (
        <div className={youtubeFrameClass} key={key}>
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className={youtubeIframeClass}
            referrerPolicy="strict-origin-when-cross-origin"
            src={`https://www.youtube.com/embed/${segment.videoId}`}
            title="YouTube video player"
          />
        </div>
      );
    }

    if (segment.type === 'subtext') {
      return (
        <p className={subtextClass} key={key}>
          {segment.content}
        </p>
      );
    }

    if (segment.type === 'align') {
      return (
        <div className={alignedBlockClass} key={key} style={{ textAlign: segment.align }}>
          {renderRichMarkdown({
            markdown: segment.content,
            renderMarkdownFragment,
          })}
        </div>
      );
    }

    const summaryClassName =
      segment.headingLevel === 1
        ? toggleSummaryH1Class
        : segment.headingLevel === 2
          ? toggleSummaryH2Class
          : segment.headingLevel === 3
            ? toggleSummaryH3Class
            : segment.headingLevel === 4
              ? toggleSummaryH4Class
              : toggleListSummaryClass;

    return (
      <details className={toggleClass} key={key}>
        <summary className={summaryClassName}>
          <ChevronRightIcon
            aria-hidden
            className={toggleChevronClass}
            color="muted"
            data-toggle-chevron="true"
            size="sm"
          />
          <span>{segment.title}</span>
        </summary>
        <div className={toggleContentClass}>
          {renderRichMarkdown({
            markdown: segment.content,
            renderMarkdownFragment,
          })}
        </div>
      </details>
    );
  });

const youtubeFrameClass = css({
  position: 'relative',
  width: 'full',
  overflow: 'hidden',
  borderRadius: 'xl',
  border: '[1px solid var(--colors-border)]',
  background: 'surfaceMuted',
  pt: '[56.25%]',
});

const youtubeIframeClass = css({
  position: 'absolute',
  inset: '0',
  width: 'full',
  height: 'full',
  border: '[0]',
});

const subtextClass = css({
  m: '0',
  fontSize: 'sm',
  lineHeight: 'relaxed',
  color: 'muted',
});

const alignedBlockClass = css({
  '& > * + *': {
    mt: '5',
  },
});

const toggleClass = css({
  '& summary::-webkit-details-marker': {
    display: 'none',
  },
  '&[open] [data-toggle-chevron="true"]': {
    transform: 'rotate(90deg)',
  },
});

const toggleSummaryBaseClass = css({
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  width: 'full',
  listStyle: 'none',
  px: '0',
  py: '1',
  fontWeight: 'semibold',
  lineHeight: 'snug',
  _marker: {
    display: 'none',
  },
});

const toggleSummaryH1Class = cx(toggleSummaryBaseClass, markdownH1Class);

const toggleSummaryH2Class = cx(toggleSummaryBaseClass, markdownH2Class);

const toggleSummaryH3Class = cx(toggleSummaryBaseClass, markdownH3Class);

const toggleSummaryH4Class = cx(toggleSummaryBaseClass, markdownH4Class);

const toggleListSummaryClass = cx(
  toggleSummaryBaseClass,
  markdownH4Class,
  css({
    px: '0',
    py: '1',
  }),
);

const toggleChevronClass = css({
  flex: 'none',
  transition: 'transform',
});

const toggleContentClass = css({
  pl: '[1.75rem]',
  pb: '3',
  '& > * + *': {
    mt: '4',
  },
});
