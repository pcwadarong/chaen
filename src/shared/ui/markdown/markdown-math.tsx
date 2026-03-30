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
export const MarkdownMath = ({ formula, isBlock = false }: MarkdownMathProps) => {
  const html = renderMathHtml({
    formula,
    isBlock,
  });

  if (isBlock) {
    return (
      <div
        className={mathBlockClass}
        data-markdown-math="block"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={mathInlineClass}
      data-markdown-math="inline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

const mathInlineClass = css({
  display: 'inline',
  verticalAlign: 'middle',
  maxWidth: 'full',
  overflow: 'visible',
});

const mathBlockClass = css({
  display: 'block',
  width: 'full',
  overflow: 'visible',
  py: '2',
});
