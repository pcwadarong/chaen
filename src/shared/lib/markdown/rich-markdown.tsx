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
import {
  createRichMarkdownRendererRegistry,
  type PartialRichMarkdownRendererRegistry,
} from '@/shared/lib/markdown/rich-markdown-renderers';
import { ChevronRightIcon } from '@/shared/ui/icons/app-icons';

type MarkdownFragmentRenderer = (markdown: string, key: string) => ReactNode;

type RenderRichMarkdownArgs = RichMarkdownRenderArgs & {
  renderMarkdownFragment: MarkdownFragmentRenderer;
  renderers?: PartialRichMarkdownRendererRegistry;
};

/**
 * custom markdown segment와 일반 markdown fragment를 합쳐 최종 React 노드 목록으로 변환합니다.
 * attachment/gallery/math/video는 기본 registry로 렌더링하고, 필요하면 일부 renderer를 host에서 override할 수 있습니다.
 *
 * @param markdown custom syntax가 포함될 수 있는 원본 markdown 문자열입니다.
 * @param renderMarkdownFragment 일반 markdown chunk를 렌더링할 fragment renderer입니다.
 * @param renderers custom segment renderer 일부를 교체할 때 사용하는 optional registry입니다.
 * @returns custom syntax와 일반 markdown가 결합된 React 노드 목록입니다.
 */
export const renderRichMarkdown = ({
  markdown,
  renderMarkdownFragment,
  renderers,
}: RenderRichMarkdownArgs) => {
  const resolvedRenderers = createRichMarkdownRendererRegistry(renderers);

  return parseRichMarkdownSegments(normalizeMarkdownHtmlAliases(markdown)).map((segment, index) => {
    const key = `rich-markdown-${index}`;

    if (segment.type === 'markdown') {
      return (
        <Fragment key={key}>
          {renderMarkdownFragment(preprocessMarkdownInlineSyntax(segment.markdown), key)}
        </Fragment>
      );
    }

    if (segment.type === 'video') {
      return resolvedRenderers.video({ key, segment });
    }

    if (segment.type === 'attachment') {
      return resolvedRenderers.attachment({ key, segment });
    }

    if (segment.type === 'math') {
      return resolvedRenderers.math({ key, segment });
    }

    if (segment.type === 'gallery') {
      return resolvedRenderers.gallery({ key, segment });
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
            renderers: resolvedRenderers,
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
            renderers: resolvedRenderers,
          })}
        </div>
      </details>
    );
  });
};

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
