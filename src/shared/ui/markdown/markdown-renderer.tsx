import React, {
  type AnchorHTMLAttributes,
  Children,
  type ImgHTMLAttributes,
  isValidElement,
  type JSX,
  type ReactNode,
} from 'react';
import { type Components, MarkdownAsync } from 'react-markdown';
import rehypePrettyCode, { type Options as RehypePrettyCodeOptions } from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import { css, cx } from 'styled-system/css';

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
 * markdown 본문 이미지를 반응형으로 렌더링합니다.
 */
const renderMarkdownImage = function renderMarkdownImage({
  alt,
  src,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  // markdown 본문 이미지는 원본 src를 그대로 존중해야 합니다.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt ?? ''} className={markdownImageClass} src={src} {...props} />;
};

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
  img: renderMarkdownImage,
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

const markdownRootClass = css({
  color: 'text',
  fontSize: 'md',
  lineHeight: 'loose',
  '& > * + *': {
    mt: '5',
  },
  '& p': {
    wordBreak: 'keep-all',
  },
  '& ul, & ol': {
    paddingLeft: '[1.25rem]',
  },
  '& li + li': {
    mt: '2',
  },
});

const markdownLinkClass = css({
  color: 'primary',
  textDecoration: 'underline',
  textDecorationThickness: '[0.08em]',
  textUnderlineOffset: '[0.18em]',
  _focusVisible: {
    outline: '[2px solid var(--colors-primary)]',
    outlineOffset: '[2px]',
  },
});

const markdownBlockquoteClass = css({
  m: '0',
  px: '5',
  py: '4',
  borderLeft: '[4px solid var(--colors-primary)]',
  borderRadius: 'xs',
  background: 'surfaceMuted',
  color: 'text',
});

const markdownInlineCodeClass = css({
  px: '[0.375rem]',
  py: '[0.125rem]',
  borderRadius: 'xs',
  background: 'surfaceMuted',
  fontFamily: 'mono',
  fontSize: '[0.95em]',
});

const markdownH1Class = css({
  fontSize: '[clamp(2rem, 4vw, 2.5rem)]',
  lineHeight: 'tight',
  letterSpacing: '[-0.04em]',
});

const markdownH2Class = css({
  fontSize: '[clamp(1.5rem, 3vw, 2rem)]',
  lineHeight: 'tight',
  letterSpacing: '[-0.035em]',
});

const markdownH3Class = css({
  fontSize: '[clamp(1.25rem, 2.4vw, 1.5rem)]',
  lineHeight: 'snug',
  letterSpacing: '[-0.03em]',
});

const markdownCodeBlockFrameClass = css({
  overflow: 'hidden',
  border: '[1px solid var(--colors-border)]',
  borderRadius: '[1rem]',
  background: '[linear-gradient(180deg, #1D1E23, #111216)]',
  boxShadow: 'floating',
});

const markdownCodeBlockHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  px: '[1rem]',
  py: '[0.75rem]',
  borderBottom: '[1px solid rgb(255 255 255 / 0.1)]',
});

const markdownTrafficLightRowClass = css({
  display: 'inline-flex',
  gap: '[0.45rem]',
});

const markdownTrafficLightClass = css({
  display: 'block',
  width: '[0.75rem]',
  height: '[0.75rem]',
  borderRadius: 'full',
});

const markdownTrafficLightRedClass = css({
  background: '[#ff5f57]',
});

const markdownTrafficLightYellowClass = css({
  background: '[#febc2e]',
});

const markdownTrafficLightGreenClass = css({
  background: '[#28c840]',
});

const markdownCodeBlockLanguageClass = css({
  color: '[rgb(226 232 240 / 0.92)]',
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: '[0.08em]',
  textTransform: 'uppercase',
});

const markdownCodeBlockPreClass = css({
  m: '0',
  overflowX: 'auto',
  p: '[1rem]',
  _focusVisible: {
    outline: '[2px solid var(--colors-primary)]',
    outlineOffset: '[-2px]',
  },
  '& code': {
    display: 'grid',
    fontFamily: 'mono',
    fontSize: '[0.95rem]',
    lineHeight: 'relaxed',
  },
});

const markdownTableScrollClass = css({
  overflowX: 'auto',
  _focusVisible: {
    outline: '[2px solid var(--colors-primary)]',
    outlineOffset: '[2px]',
  },
});

const markdownTableClass = css({
  width: 'full',
  minWidth: '[32rem]',
  borderCollapse: 'collapse',
  borderSpacing: '0',
  overflow: 'hidden',
  border: '[1px solid var(--colors-border)]',
  borderRadius: 'sm',
  '& th, & td': {
    px: '[1rem]',
    py: '[0.85rem]',
    borderBottom: '[1px solid var(--colors-border)]',
    textAlign: 'left',
  },
  '& th': {
    background: 'surfaceMuted',
    fontWeight: '[700]',
  },
  '& tr:last-child td': {
    borderBottom: 'none',
  },
});

const markdownImageClass = css({
  display: 'block',
  maxWidth: 'full',
  height: 'auto',
  borderRadius: 'lg',
});

const markdownEmptyTextClass = css({
  color: 'muted',
});
