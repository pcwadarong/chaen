import React, { Fragment, type ReactNode } from 'react';
import { css, cx } from 'styled-system/css';

import {
  normalizeMarkdownHtmlAliases,
  preprocessMarkdownInlineSyntax,
} from '@/entities/editor-core/model/markdown-inline';
import {
  parseRichMarkdownSegments,
  type RichMarkdownRenderArgs,
} from '@/entities/editor-core/model/markdown-segments';
import {
  markdownH1Class,
  markdownH2Class,
  markdownH3Class,
  markdownH4Class,
} from '@/shared/lib/markdown/markdown-config';
import { ChevronRightIcon } from '@/shared/ui/icons/app-icons';
import { MarkdownAttachment } from '@/shared/ui/markdown/markdown-attachment';
import { MarkdownGallery } from '@/shared/ui/markdown/markdown-gallery';
import { MarkdownMath } from '@/shared/ui/markdown/markdown-math';
import { MarkdownVideo } from '@/shared/ui/markdown/markdown-video';

type MarkdownFragmentRenderer = (markdown: string, key: string) => ReactNode;
/**
 * custom markdown segment와 일반 markdown fragment를 합쳐 최종 React 노드 목록으로 변환합니다.
 *
 * @param markdown custom syntax가 포함될 수 있는 원본 markdown 문자열입니다.
 * @param renderMarkdownFragment 일반 markdown chunk를 렌더링할 fragment renderer입니다.
 * @returns custom syntax와 일반 markdown가 결합된 React 노드 목록입니다.
 */
export const renderRichMarkdown = ({
  markdown,
  renderMarkdownFragment,
}: RichMarkdownRenderArgs & {
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

    if (segment.type === 'video') {
      return (
        <MarkdownVideo
          key={key}
          provider={segment.provider}
          src={segment.src}
          videoId={segment.videoId}
        />
      );
    }

    if (segment.type === 'attachment') {
      return (
        <MarkdownAttachment
          contentType={segment.contentType}
          fileName={segment.fileName}
          fileSize={segment.fileSize}
          href={segment.href}
          key={key}
        />
      );
    }

    if (segment.type === 'math') {
      return <MarkdownMath formula={segment.formula} isBlock={segment.isBlock} key={key} />;
    }

    if (segment.type === 'gallery') {
      return <MarkdownGallery galleryId={key} items={segment.items} key={key} />;
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

    if (segment.type !== 'toggle') {
      return null;
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
