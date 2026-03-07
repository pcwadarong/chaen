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

import styles from './markdown-renderer.module.css';

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
      className={styles.link}
      rel={isExternalHref(href) ? 'noreferrer noopener' : undefined}
      target={isExternalHref(href) ? '_blank' : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => <blockquote className={styles.blockquote}>{children}</blockquote>,
  code: ({ children, className, ...props }) => {
    if (isBlockCode(className, props as Record<string, unknown>)) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code className={styles.inlineCode} {...props}>
        {children}
      </code>
    );
  },
  h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
  h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
  h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
  pre: ({ children, className, ...props }) => (
    <div className={styles.codeBlockFrame}>
      <div className={styles.codeBlockHeader}>
        <div aria-hidden className={styles.trafficLightRow}>
          <span className={`${styles.trafficLight} ${styles.trafficLightRed}`} />
          <span className={`${styles.trafficLight} ${styles.trafficLightYellow}`} />
          <span className={`${styles.trafficLight} ${styles.trafficLightGreen}`} />
        </div>
        <span className={styles.codeBlockLanguage}>{getCodeBlockLanguage(children)}</span>
      </div>
      <pre
        className={className ? `${styles.codeBlockPre} ${className}` : styles.codeBlockPre}
        {...props}
      >
        {children}
      </pre>
    </div>
  ),
  table: ({ children }) => (
    <div className={styles.tableScroll}>
      <table className={styles.table}>{children}</table>
    </div>
  ),
};

/**
 * Markdown 문자열을 SSR 친화적인 React 노드로 렌더링합니다.
 */
export const MarkdownRenderer = async ({ emptyText, markdown }: MarkdownRendererProps) => {
  if (!markdown) return emptyText ? <p className={styles.emptyText}>{emptyText}</p> : null;

  return (
    <div className={styles.root}>
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
