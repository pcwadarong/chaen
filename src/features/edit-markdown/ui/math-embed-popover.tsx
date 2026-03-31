'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { css } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { type ClosePopover, Popover } from '@/shared/ui/popover/popover';
import { Textarea } from '@/shared/ui/textarea/textarea';

type MathEmbedPopoverProps = {
  onApply: (formula: string, isBlock: boolean, closePopover?: ClosePopover) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

type MathTemplate = {
  formula: string;
  key: string;
  label: string;
  selection: {
    end: number;
    start: number;
  };
};

/**
 * 수식 템플릿 문자열과 핵심 편집 구간을 함께 생성합니다.
 *
 * @param key 템플릿 식별자입니다.
 * @param label 툴바에 노출할 템플릿 이름입니다.
 * @param prefix 선택 구간 앞에 오는 수식 조각입니다.
 * @param editable 사용자가 바로 바꿀 핵심 수식 조각입니다.
 * @param suffix 선택 구간 뒤에 오는 수식 조각입니다.
 * @returns formula와 selection을 포함한 템플릿 정보를 반환합니다.
 */
const createMathTemplate = ({
  editable,
  key,
  label,
  prefix,
  suffix,
}: {
  editable: string;
  key: string;
  label: string;
  prefix: string;
  suffix: string;
}): MathTemplate => ({
  formula: `${prefix}${editable}${suffix}`,
  key,
  label,
  selection: {
    end: prefix.length + editable.length,
    start: prefix.length,
  },
});

const mathTemplates = [
  createMathTemplate({
    editable: 'a',
    key: 'fraction',
    label: '분수',
    prefix: '\\frac{',
    suffix: '}{b}',
  }),
  createMathTemplate({
    editable: 'x',
    key: 'sqrt',
    label: '루트',
    prefix: '\\sqrt{',
    suffix: '}',
  }),
  createMathTemplate({
    editable: 'i=1',
    key: 'sum',
    label: '합',
    prefix: '\\sum_{',
    suffix: '}^{n} i',
  }),
  createMathTemplate({
    editable: 'f(x)',
    key: 'integral',
    label: '적분',
    prefix: '\\int_{a}^{b} ',
    suffix: ' \\, dx',
  }),
  createMathTemplate({
    editable: ' x, &x \\ge 0 \\\\ -x, &x < 0',
    key: 'cases',
    label: 'cases',
    prefix: '\\begin{cases}',
    suffix: ' \\end{cases}',
  }),
] satisfies ReadonlyArray<MathTemplate>;

/**
 * toolbar 내부에서 LaTeX 수식을 입력받아 inline/block 문법으로 삽입하는 팝오버입니다.
 */
export const MathEmbedPopover = ({
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: MathEmbedPopoverProps) => {
  const [mathInput, setMathInput] = useState('');
  const [selectionRange, setSelectionRange] = useState<MathTemplate['selection'] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    if (!selectionRange || !textareaRef.current) return;

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(selectionRange.start, selectionRange.end);
    setSelectionRange(null);
  }, [selectionRange]);

  /**
   * 자주 쓰는 수식 템플릿을 textarea에 채웁니다.
   */
  const handleTemplateSelect = (template: MathTemplate) => {
    setMathInput(template.formula);
    setSelectionRange(template.selection);
  };

  const handleApply = (isBlock: boolean, closePopover?: ClosePopover) => {
    const normalizedInput = mathInput.trim();
    if (!normalizedInput) return;

    onApply(normalizedInput, isBlock, closePopover);
    setMathInput('');
  };

  return (
    <Popover
      onTriggerMouseDown={onTriggerMouseDown}
      panelLabel="수학 공식 삽입"
      portalPlacement="start"
      renderInPortal
      triggerAriaLabel="수학 공식"
      triggerClassName={triggerClassName}
      triggerContent={<span className={triggerTokenClass}>fx</span>}
      triggerTooltip="수학 공식"
    >
      {({ closePopover }) => (
        <div className={popoverContentClass}>
          <div className={templateGridClass}>
            {mathTemplates.map(template => (
              <Button
                key={template.key}
                onClick={() => handleTemplateSelect(template)}
                size="xs"
                tone="white"
                variant="ghost"
              >
                {template.label}
              </Button>
            ))}
          </div>
          <Textarea
            aria-label="LaTeX 수식"
            autoResize={false}
            onChange={event => setMathInput(event.target.value)}
            onMouseDown={event => event.stopPropagation()}
            placeholder={
              '\\frac{a}{b} 또는 \\begin{cases} x, &x \\ge 0 \\\\ -x, &x < 0 \\end{cases}'
            }
            ref={textareaRef}
            rows={4}
            value={mathInput}
          />
          <div className={actionRowClass}>
            <Button onClick={() => handleApply(false, closePopover)}>인라인</Button>
            <Button onClick={() => handleApply(true, closePopover)}>블록</Button>
          </div>
        </div>
      )}
    </Popover>
  );
};

const popoverContentClass = css({
  display: 'grid',
  gap: '3',
  minWidth: '[20rem]',
});

const templateGridClass = css({
  display: 'flex',
  gap: '2',
  flexWrap: 'wrap',
});

const actionRowClass = css({
  display: 'flex',
  gap: '2',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
});

const triggerTokenClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '7',
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '[-0.02em]',
});
