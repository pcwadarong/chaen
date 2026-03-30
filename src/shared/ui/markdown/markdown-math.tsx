import katex from 'katex';
import React from 'react';
import { css } from 'styled-system/css';

type MarkdownMathProps = {
  formula: string;
  isBlock?: boolean;
};

type RenderedMathResult =
  | {
      html: string;
      ok: true;
    }
  | {
      errorMessage: string;
      ok: false;
    };

/**
 * LaTeX 수식을 KaTeX HTML 문자열로 변환합니다.
 */
const renderMathHtml = ({ formula, isBlock = false }: MarkdownMathProps): RenderedMathResult => {
  try {
    return {
      html: katex.renderToString(formula, {
        displayMode: isBlock,
        output: 'html',
        strict: 'ignore',
        throwOnError: true,
      }),
      ok: true,
    };
  } catch (error) {
    return {
      errorMessage: error instanceof Error ? error.message : '알 수 없는 수식 오류',
      ok: false,
    };
  }
};

/**
 * markdown 커스텀 Math 구문을 KaTeX 수식으로 렌더링합니다.
 */
export const MarkdownMath = ({ formula, isBlock = false }: MarkdownMathProps) => {
  const result = renderMathHtml({
    formula,
    isBlock,
  });

  if (!result.ok) {
    if (isBlock) {
      return (
        <div
          aria-label="수학 공식 오류"
          className={mathFallbackBlockClass}
          data-markdown-math="block"
          data-markdown-math-error="true"
        >
          <span className={mathFallbackLabelClass}>수식 오류</span>
          <code className={mathFallbackFormulaClass}>{formula}</code>
          <span className={mathFallbackHintClass}>{result.errorMessage}</span>
        </div>
      );
    }

    return (
      <span
        aria-label="수학 공식 오류"
        className={mathFallbackInlineClass}
        data-markdown-math="inline"
        data-markdown-math-error="true"
        title={result.errorMessage}
      >
        <code className={mathFallbackFormulaClass}>{formula}</code>
        <span className={mathFallbackInlineHintClass}>수식 오류</span>
      </span>
    );
  }

  if (isBlock) {
    return (
      <div
        className={mathBlockClass}
        data-markdown-math="block"
        dangerouslySetInnerHTML={{ __html: result.html }}
      />
    );
  }

  return (
    <span
      className={mathInlineClass}
      data-markdown-math="inline"
      dangerouslySetInnerHTML={{ __html: result.html }}
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

const mathFallbackInlineClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '1.5',
  py: '0.5',
  borderRadius: 'sm',
  backgroundColor: 'surfaceMuted',
  color: 'error',
  verticalAlign: 'middle',
  whiteSpace: 'normal',
});

const mathFallbackBlockClass = css({
  display: 'grid',
  gap: '1.5',
  width: 'full',
  px: '3',
  py: '3',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'borderStrong',
  backgroundColor: 'surfaceMuted',
});

const mathFallbackLabelClass = css({
  fontSize: 'xs',
  fontWeight: 'semibold',
  color: 'error',
});

const mathFallbackFormulaClass = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

const mathFallbackHintClass = css({
  fontSize: 'xs',
  color: 'error',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

const mathFallbackInlineHintClass = css({
  fontSize: 'xs',
  fontWeight: 'medium',
});
