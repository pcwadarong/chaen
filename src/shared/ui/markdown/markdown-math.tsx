import katex from 'katex';
import React from 'react';
import { css } from 'styled-system/css';

type MarkdownMathProps = {
  formula: string;
  isBlock?: boolean;
};

/**
 * LaTeX 수식을 KaTeX HTML 문자열로 변환합니다.
 */
const renderMathHtml = ({ formula, isBlock = false }: MarkdownMathProps) =>
  katex.renderToString(formula, {
    displayMode: isBlock,
    output: 'html',
    strict: 'ignore',
    throwOnError: false,
  });

/**
 * markdown 커스텀 Math 구문을 KaTeX 수식으로 렌더링합니다.
 */
export const MarkdownMath = ({ formula, isBlock = false }: MarkdownMathProps) => (
  <div
    className={isBlock ? mathBlockClass : mathInlineClass}
    data-markdown-math={isBlock ? 'block' : 'inline'}
    dangerouslySetInnerHTML={{
      __html: renderMathHtml({
        formula,
        isBlock,
      }),
    }}
  />
);

const mathInlineClass = css({
  display: 'inline-block',
  verticalAlign: 'middle',
  maxWidth: 'full',
  overflowX: 'auto',
});

const mathBlockClass = css({
  display: 'block',
  width: 'full',
  overflowX: 'auto',
  py: '2',
});
