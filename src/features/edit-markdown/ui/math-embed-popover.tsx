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

const mathTemplates = [
  {
    formula: '\\frac{a}{b}',
    key: 'fraction',
    label: '분수',
    selection: {
      end: '\\frac{'.length + 1,
      start: '\\frac{'.length,
    },
  },
  {
    formula: '\\sqrt{x}',
    key: 'sqrt',
    label: '루트',
    selection: {
      end: '\\sqrt{x}'.indexOf('x') + 1,
      start: '\\sqrt{x}'.indexOf('x'),
    },
  },
  {
    formula: '\\sum_{i=1}^{n} i',
    key: 'sum',
    label: '합',
    selection: {
      end: '\\sum_{i=1}^{n} i'.indexOf('i=1') + 'i=1'.length,
      start: '\\sum_{i=1}^{n} i'.indexOf('i=1'),
    },
  },
  {
    formula: '\\int_{a}^{b} f(x) \\, dx',
    key: 'integral',
    label: '적분',
    selection: {
      end: '\\int_{a}^{b} f(x) \\, dx'.indexOf('f(x)') + 'f(x)'.length,
      start: '\\int_{a}^{b} f(x) \\, dx'.indexOf('f(x)'),
    },
  },
  {
    formula: '\\begin{cases} x, &x \\ge 0 \\\\ -x, &x < 0 \\end{cases}',
    key: 'cases',
    label: 'cases',
    selection: {
      end: '\\begin{cases} x, &x \\ge 0 \\\\ -x, &x < 0 \\end{cases}'.indexOf(' \\end{cases}'),
      start: '\\begin{cases} x, &x \\ge 0 \\\\ -x, &x < 0 \\end{cases}'.indexOf(
        ' x, &x \\ge 0 \\\\ -x, &x < 0 ',
      ),
    },
  },
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
