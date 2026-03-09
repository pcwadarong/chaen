import React, {
  type AnchorHTMLAttributes,
  Children,
  isValidElement,
  type JSX,
  type ReactNode,
} from 'react';
import { type Components, MarkdownAsync } from 'react-markdown';
import rehypePrettyCode, { type Options as RehypePrettyCodeOptions } from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import { cx } from 'styled-system/css';

import {
  markdownBlockquoteClass,
  markdownCodeBlockFrameClass,
  markdownCodeBlockHeaderClass,
  markdownCodeBlockLanguageClass,
  markdownCodeBlockPreClass,
  markdownEmptyTextClass,
  markdownH1Class,
  markdownH2Class,
  markdownH3Class,
  markdownInlineCodeClass,
  markdownLinkClass,
  markdownRootClass,
  markdownTableClass,
  markdownTableScrollClass,
  markdownTrafficLightClass,
  markdownTrafficLightGreenClass,
  markdownTrafficLightRedClass,
  markdownTrafficLightRowClass,
  markdownTrafficLightYellowClass,
} from './markdown-renderer.styles';

type MarkdownRendererProps = {
  emptyText?: string;
  markdown: string | null;
};

/**
 * rehype-pretty-code에 전달할 코드 하이라이트 옵션입니다.
 */
const prettyCodeOptions: RehypePrettyCodeOptions = {
  defaultLang: 'plaintext',
  keepBackground: false,
  theme: 'github-dark',
};

/**
 * 외부 링크 여부를 판별합니다.
 */
const isExternalHref = (href?: string) => Boolean(href && /^https?:\/\//.test(href));

/**
 * 코드 블럭 자식에서 표시용 언어명을 추출합니다.
 */
const getCodeBlockLanguage = (children: ReactNode) => {
  const firstChild = Children.toArray(children)[0];
  if (!isValidElement<JSX.IntrinsicElements['code']>(firstChild)) return 'text';

  const codeProps = firstChild.props as JSX.IntrinsicElements['code'] & Record<string, unknown>;
  const language = codeProps['data-language'];
  if (typeof language === 'string' && language.length > 0) return language;

  const className = codeProps.className;
  if (typeof className !== 'string') return 'text';

  return className.replace('language-', '') || 'text';
};

/**
 * 코드 블럭 스크롤 영역에 제공할 접근성 라벨을 생성합니다.
 */
const getCodeBlockAriaLabel = (children: ReactNode) =>
  `Code block: ${getCodeBlockLanguage(children)}`;

/**
 * 현재 code 노드가 블록 코드 내부인지 판별합니다.
 */
const isBlockCode = (className?: string, props?: Record<string, unknown>) =>
  Boolean(
    className ||
    (typeof props?.['data-language'] === 'string' && props['data-language'].length > 0) ||
    (typeof props?.['data-theme'] === 'string' && props['data-theme'].length > 0),
  );

/**
 * Markdown AST 노드를 서비스 UI에 맞는 React 컴포넌트로 치환합니다.
 */
const markdownComponents: Components = {
  a: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      className={markdownLinkClass}
      rel={isExternalHref(href) ? 'noreferrer noopener' : undefined}
      target={isExternalHref(href) ? '_blank' : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className={markdownBlockquoteClass}>{children}</blockquote>
  ),
  code: ({ children, className, ...props }) => {
    if (isBlockCode(className, props as Record<string, unknown>)) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code className={markdownInlineCodeClass} {...props}>
        {children}
      </code>
    );
  },
  h1: ({ children }) => <h1 className={markdownH1Class}>{children}</h1>,
  h2: ({ children }) => <h2 className={markdownH2Class}>{children}</h2>,
  h3: ({ children }) => <h3 className={markdownH3Class}>{children}</h3>,
  pre: ({ children, className, ...props }) => (
    <div className={markdownCodeBlockFrameClass}>
      <div className={markdownCodeBlockHeaderClass}>
        <div aria-hidden className={markdownTrafficLightRowClass}>
          <span className={cx(markdownTrafficLightClass, markdownTrafficLightRedClass)} />
          <span className={cx(markdownTrafficLightClass, markdownTrafficLightYellowClass)} />
          <span className={cx(markdownTrafficLightClass, markdownTrafficLightGreenClass)} />
        </div>
        <span className={markdownCodeBlockLanguageClass}>{getCodeBlockLanguage(children)}</span>
      </div>
      <pre
        aria-label={getCodeBlockAriaLabel(children)}
        className={
          className ? `${markdownCodeBlockPreClass} ${className}` : markdownCodeBlockPreClass
        }
        tabIndex={0}
        {...props}
      >
        {children}
      </pre>
    </div>
  ),
  table: ({ children }) => (
    <div aria-label="Markdown table" className={markdownTableScrollClass} tabIndex={0}>
      <table className={markdownTableClass}>{children}</table>
    </div>
  ),
};

/**
 * Markdown 문자열을 SSR 친화적인 React 노드로 렌더링합니다.
 */
export const MarkdownRenderer = async ({ emptyText, markdown }: MarkdownRendererProps) => {
  if (!markdown) return emptyText ? <p className={markdownEmptyTextClass}>{emptyText}</p> : null;

  return (
    <div className={markdownRootClass}>
      <MarkdownAsync
        components={markdownComponents}
        rehypePlugins={[[rehypePrettyCode, prettyCodeOptions]]}
        remarkPlugins={[remarkGfm]}
      >
        {markdown}
      </MarkdownAsync>
    </div>
  );
};
