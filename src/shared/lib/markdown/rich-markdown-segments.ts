import type { ReactNode } from 'react';

import { collectMarkdownImages } from '@/shared/lib/markdown/collect-markdown-images';

type MarkdownFragmentRenderer = (markdown: string, key: string) => ReactNode;

type ToggleHeadingLevel = 1 | 2 | 3 | 4 | null;

export type MarkdownSegment =
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
      contentType?: string;
      fileName: string;
      fileSize?: number;
      href: string;
      type: 'attachment';
    }
  | {
      formula: string;
      isBlock: boolean;
      type: 'math';
    }
  | {
      items: ReturnType<typeof collectMarkdownImages>;
      type: 'gallery';
    }
  | {
      provider: 'upload' | 'youtube';
      src?: string;
      type: 'video';
      videoId?: string;
    };

export type RichMarkdownRenderArgs = {
  markdown: string;
  renderMarkdownFragment: MarkdownFragmentRenderer;
};

type FenceState = {
  delimiter: '`' | '~';
  size: number;
} | null;

const toggleStartPrefix = ':::toggle ';
const galleryStartPattern = /^:::gallery\s*$/;
const alignStartPattern = /^:::align (left|center|right)\s*$/;
const legacyYoutubePattern = /^<YouTube id="([^"]+)" \/>$/;
const videoPattern = /^<Video provider="([^"]+)"(?: id="([^"]+)")?(?: src="([^"]+)")? \/>$/;
const attachmentPattern =
  /^<Attachment href="([^"]+)" name="([^"]+)"(?: size="(\d+)")?(?: type="([^"]+)")? \/>$/;
const mathPattern = /^<Math(?: block="(true)")?>([\s\S]+?)<\/Math>$/;
const subtextPrefix = '-# ';
const fenceBoundaryPattern = /^\s*(`{3,}|~{3,})/;

/**
 * editor template이 escape한 HTML attribute entity를 원래 문자열로 복원합니다.
 *
 * @param value custom tag attribute에서 읽은 raw 문자열입니다.
 * @returns entity가 복원된 일반 문자열입니다.
 */
export const decodeHtmlAttributeEntities = (value: string) =>
  value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');

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
 * toggle summary 문자열 앞의 heading prefix를 읽어 summary 스타일 레벨과 본문 제목을 분리합니다.
 *
 * @param rawTitle toggle 시작 줄에서 `:::toggle ` 뒤의 원본 문자열입니다.
 * @returns heading 레벨과 실제 제목 문자열입니다.
 */
export const parseToggleTitle = (rawTitle: string) => {
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
 * custom block 내부 본문을 읽으면서 fenced code block 안의 `:::` 종료 토큰은 무시합니다.
 *
 * @param lines 전체 markdown 라인 배열입니다.
 * @param startIndex 본문 읽기를 시작할 첫 줄 index입니다.
 * @returns 본문 라인과 종료 지점 cursor를 함께 반환합니다.
 */
const consumeCustomBlockBody = (lines: string[], startIndex: number) => {
  const bodyLines: string[] = [];
  let activeFence: FenceState = null;
  let cursor = startIndex;

  while (cursor < lines.length) {
    const line = lines[cursor];
    const fenceBoundary = getFenceBoundary(line, activeFence);

    if (fenceBoundary) {
      bodyLines.push(line);
      activeFence = activeFence ? null : fenceBoundary;
      cursor += 1;
      continue;
    }

    if (!activeFence && line === ':::') {
      break;
    }

    bodyLines.push(line);
    cursor += 1;
  }

  return {
    bodyLines,
    cursor,
  };
};

/**
 * custom markdown block 문법을 일반 markdown chunk와 전용 block segment로 분리합니다.
 *
 * @param markdown custom syntax를 포함할 수 있는 원본 markdown 문자열입니다.
 * @returns renderer가 바로 사용할 수 있는 segment 배열입니다.
 */
export const parseRichMarkdownSegments = (markdown: string): MarkdownSegment[] => {
  const lines = markdown.split('\n');
  const segments: MarkdownSegment[] = [];
  const currentMarkdownLines: string[] = [];
  let activeFence: FenceState = null;

  /**
   * 누적된 일반 markdown 라인을 하나의 markdown segment로 밀어넣습니다.
   */
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
      const { bodyLines, cursor } = consumeCustomBlockBody(lines, index + 1);

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
      const { bodyLines, cursor } = consumeCustomBlockBody(lines, index + 1);

      segments.push({
        align: alignMatch[1] as 'center' | 'left' | 'right',
        content: bodyLines.join('\n'),
        type: 'align',
      });

      index = cursor;
      continue;
    }

    if (galleryStartPattern.test(line)) {
      flushMarkdown();
      const { bodyLines, cursor } = consumeCustomBlockBody(lines, index + 1);

      segments.push({
        items: collectMarkdownImages(bodyLines.join('\n')),
        type: 'gallery',
      });

      index = cursor;
      continue;
    }

    const videoMatch = line.match(videoPattern);

    if (videoMatch && (videoMatch[1] === 'youtube' || videoMatch[1] === 'upload')) {
      flushMarkdown();
      segments.push({
        provider: videoMatch[1],
        src: videoMatch[3] ? decodeHtmlAttributeEntities(videoMatch[3]) : undefined,
        type: 'video',
        videoId: videoMatch[2] ? decodeHtmlAttributeEntities(videoMatch[2]) : undefined,
      });
      continue;
    }

    const legacyYoutubeMatch = line.match(legacyYoutubePattern);

    if (legacyYoutubeMatch) {
      flushMarkdown();
      segments.push({
        provider: 'youtube',
        type: 'video',
        videoId: decodeHtmlAttributeEntities(legacyYoutubeMatch[1]),
      });
      continue;
    }

    const attachmentMatch = line.match(attachmentPattern);

    if (attachmentMatch) {
      flushMarkdown();
      segments.push({
        contentType: attachmentMatch[4]
          ? decodeHtmlAttributeEntities(attachmentMatch[4])
          : undefined,
        fileName: decodeHtmlAttributeEntities(attachmentMatch[2]),
        fileSize: attachmentMatch[3] ? Number(attachmentMatch[3]) : undefined,
        href: decodeHtmlAttributeEntities(attachmentMatch[1]),
        type: 'attachment',
      });
      continue;
    }

    const mathMatch = line.match(mathPattern);

    if (mathMatch) {
      flushMarkdown();
      segments.push({
        formula: mathMatch[2],
        isBlock: mathMatch[1] === 'true',
        type: 'math',
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
