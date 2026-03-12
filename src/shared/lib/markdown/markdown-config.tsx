import React, {
  type AnchorHTMLAttributes,
  Children,
  type ImgHTMLAttributes,
  isValidElement,
  type JSX,
  type ReactNode,
} from 'react';
import type { Components, Options } from 'react-markdown';
import rehypePrettyCode, { type Options as RehypePrettyCodeOptions } from 'rehype-pretty-code';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { css, cx } from 'styled-system/css';

import {
  getLinkText,
  getMarkdownLinkRenderMode,
  isEmbedKeyword,
} from '@/shared/lib/markdown/link-embed';
import { getMarkdownColorPreset } from '@/shared/lib/markdown/markdown-color-presets';
import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';
import { LinkEmbedCard } from '@/shared/ui/markdown/link-embed-card';

type MarkdownOptions = Pick<Options, 'components' | 'rehypePlugins' | 'remarkPlugins'>;
type MarkdownInlineDirective =
  | {
      type: 'background';
      value: string;
    }
  | {
      type: 'color';
      value: string;
    }
  | {
      background?: string;
      color?: string;
      type: 'style';
    }
  | {
      type: 'spoiler';
    }
  | {
      type: 'underline';
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
 * inline custom syntax를 위해 markdown link href로 encode한 directive를 해석합니다.
 */
const parseMarkdownInlineDirective = (href?: string): MarkdownInlineDirective | null => {
  if (!href) return null;

  if (href.startsWith('#md-color:')) {
    return {
      type: 'color',
      value: href.slice('#md-color:'.length),
    };
  }

  if (href.startsWith('#md-bg:')) {
    return {
      type: 'background',
      value: href.slice('#md-bg:'.length),
    };
  }

  if (href.startsWith('#md-style:')) {
    const payload = href.slice('#md-style:'.length);
    const searchParams = new URLSearchParams(payload.replace(/;/g, '&'));
    const color = searchParams.get('color') ?? undefined;
    const background = searchParams.get('background') ?? undefined;

    return {
      background,
      color,
      type: 'style',
    };
  }

  if (href === '#md-spoiler:') {
    return { type: 'spoiler' };
  }

  if (href === '#md-underline:') {
    return { type: 'underline' };
  }

  return null;
};

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
const renderMarkdownImage = ({ alt, src, ...props }: ImgHTMLAttributes<HTMLImageElement>) => {
  const resolvedAlt = alt ?? '';

  // markdown 본문 이미지는 원본 src를 그대로 존중해야 합니다.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={resolvedAlt} className={markdownImageClass} src={src} {...props} />;
};

/**
 * Markdown AST 노드를 서비스 UI에 맞는 React 컴포넌트로 치환합니다.
 */
const createMarkdownComponents = (): Components => ({
  a: ({ href, children, title, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const inlineDirective = parseMarkdownInlineDirective(href);

    if (inlineDirective?.type === 'color') {
      const preset = getMarkdownColorPreset(inlineDirective.value);

      return (
        <span
          className={markdownColoredTextClass}
          style={{ color: preset?.textColor ?? inlineDirective.value }}
        >
          {children}
        </span>
      );
    }

    if (inlineDirective?.type === 'background') {
      const preset = getMarkdownColorPreset(inlineDirective.value);

      return (
        <span
          className={markdownHighlightedTextClass}
          style={{
            backgroundColor: preset?.softBackgroundColor ?? `${inlineDirective.value}29`,
          }}
        >
          {children}
        </span>
      );
    }

    if (inlineDirective?.type === 'style') {
      const textPreset = inlineDirective.color
        ? getMarkdownColorPreset(inlineDirective.color)
        : null;
      const backgroundPreset = inlineDirective.background
        ? getMarkdownColorPreset(inlineDirective.background)
        : null;

      return (
        <span
          className={cx(
            inlineDirective.background ? markdownHighlightedTextClass : undefined,
            inlineDirective.color ? markdownColoredTextClass : undefined,
          )}
          style={{
            backgroundColor: inlineDirective.background
              ? (backgroundPreset?.softBackgroundColor ?? `${inlineDirective.background}29`)
              : undefined,
            color: inlineDirective.color
              ? (textPreset?.textColor ?? inlineDirective.color)
              : undefined,
          }}
        >
          {children}
        </span>
      );
    }

    if (inlineDirective?.type === 'spoiler') {
      return <span className={markdownSpoilerClass}>{children}</span>;
    }

    if (inlineDirective?.type === 'underline') {
      return <u className={markdownUnderlineClass}>{children}</u>;
    }

    const normalizedHref = normalizeHttpUrl(href);
    const linkText = getLinkText(children);
    const renderMode = isEmbedKeyword(children) ? 'embed' : getMarkdownLinkRenderMode(title);

    if (normalizedHref && renderMode === 'preview') {
      return (
        <LinkEmbedCard
          fallbackLabel={linkText || normalizedHref}
          url={normalizedHref}
          variant="preview"
        />
      );
    }

    if (normalizedHref && (renderMode === 'card' || renderMode === 'embed')) {
      return (
        <LinkEmbedCard
          fallbackLabel={renderMode === 'embed' ? normalizedHref : linkText || normalizedHref}
          url={normalizedHref}
          variant="card"
        />
      );
    }

    return (
      <a
        href={href}
        className={markdownLinkClass}
        rel={isExternalHref(href) ? 'noreferrer noopener' : undefined}
        target={isExternalHref(href) ? '_blank' : undefined}
        title={title}
        {...props}
      >
        {children}
      </a>
    );
  },
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
  h4: ({ children }) => <h4 className={markdownH4Class}>{children}</h4>,
  hr: () => <hr className={markdownHorizontalRuleClass} />,
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
});

/**
 * 서버/클라이언트에서 공통으로 사용할 markdown 렌더링 옵션을 구성합니다.
 */
export const getMarkdownOptions = (): MarkdownOptions => ({
  components: createMarkdownComponents(),
  rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
  remarkPlugins: [remarkGfm, remarkBreaks],
});

/**
 * 아티클 본문과 preview에서 공통으로 사용할 markdown 래퍼 스타일입니다.
 */
export const markdownBodyClass = css({
  color: 'text',
  fontSize: 'md',
  lineHeight: 'loose',
  '& > * + *': {
    mt: '5',
  },
  '& > :is(h1, h2, h3, h4)': {
    mt: '7',
    mb: '0',
  },
  '& > :is(h1, h2, h3, h4) + *': {
    mt: '5',
  },
  '& > hr': {
    my: '8',
  },
  '& p': {
    wordBreak: 'keep-all',
  },
  '& ul, & ol': {
    my: '3',
  },
  '& ul': {
    pl: '0',
    listStyle: 'none',
  },
  '& ol': {
    pl: '[1.75rem]',
    listStyle: 'decimal',
  },
  '& li': {
    wordBreak: 'keep-all',
  },
  '& ul > li': {
    position: 'relative',
    pl: '[1.25rem]',
    listStyle: 'none',
  },
  '& ul > li::before': {
    content: '""',
    position: 'absolute',
    left: '[0.35rem]',
    top: '[0.9em]',
    width: '[0.33rem]',
    height: '[0.33rem]',
    borderRadius: 'full',
    background: '[currentColor]',
    opacity: '0.7',
    transform: 'translateY(-50%)',
  },
  '& ol > li::marker': {
    color: 'muted',
    fontWeight: 'semibold',
  },
  '& li > p': {
    display: 'inline',
  },
  '& li > ul, & li > ol': {
    mt: '1',
  },
  '& ul ul, & ul ol, & ol ul, & ol ol': {
    mt: '1',
  },
  '& ul ul': {
    pl: '[1.5rem]',
  },
  '& ul ul > li::before': {
    width: '[0.28rem]',
    height: '[0.28rem]',
  },
  '& li + li': {
    mt: '1',
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

export const markdownH1Class = css({
  fontSize: '[clamp(2rem, 4vw, 2.5rem)]',
  lineHeight: 'tight',
  letterSpacing: '[-0.04em]',
  fontWeight: 'bold',
});

export const markdownH2Class = css({
  fontSize: '[clamp(1.5rem, 3vw, 2rem)]',
  lineHeight: 'tight',
  letterSpacing: '[-0.035em]',
  fontWeight: 'bold',
});

export const markdownH3Class = css({
  fontSize: '[clamp(1.25rem, 2.4vw, 1.5rem)]',
  lineHeight: 'snug',
  letterSpacing: '[-0.03em]',
  fontWeight: 'bold',
});

export const markdownH4Class = css({
  fontSize: 'xl',
  lineHeight: 'snug',
  letterSpacing: '[-0.02em]',
  fontWeight: 'bold',
});

const markdownUnderlineClass = css({
  textDecoration: 'underline',
  textUnderlineOffset: '[0.18em]',
  textDecorationThickness: '[0.08em]',
});

const markdownHorizontalRuleClass = css({
  border: '[0]',
  height: '[1px]',
  background: 'border',
  my: '8',
});

const markdownColoredTextClass = css({
  fontWeight: 'medium',
});

const markdownHighlightedTextClass = css({
  display: 'inline',
  px: '[0.25rem]',
  py: '[0.08rem]',
  borderRadius: '[0.35rem]',
  fontWeight: 'medium',
});

const markdownSpoilerClass = css({
  px: '[0.25rem]',
  py: '[0.08rem]',
  borderRadius: '[0.35rem]',
  background: '[rgba(100, 116, 139, 0.2)]',
  color: 'transparent',
  textShadow: '[0 0 0 transparent]',
  transition: '[color 160ms ease]',
  _hover: {
    color: 'text',
  },
  _focusVisible: {
    color: 'text',
  },
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

/**
 * 비어 있는 markdown 본문에 사용할 대체 문구 스타일입니다.
 */
export const markdownEmptyTextClass = css({
  color: 'muted',
});
