import React from 'react';
import { css, cx } from 'styled-system/css';
import type { RecipeVariantProps } from 'styled-system/types/recipe';

import { buttonRecipe } from '@/shared/ui/button/button.recipe';

export type ButtonTone = 'white' | 'primary' | 'black';
export type ButtonVariant = 'solid' | 'ghost' | 'underline';
export type ButtonSize = 'sm' | 'md';

type ButtonRecipeProps = RecipeVariantProps<typeof buttonRecipe>;

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> &
  ButtonRecipeProps & {
    asChild?: boolean;
    leadingVisual?: React.ReactNode;
    trailingVisual?: React.ReactNode;
  };

const buttonLabelClass = css({
  display: 'inline-flex',
  alignItems: 'center',
});

const buttonVisualClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
});

/**
 * 버튼 내부에서 아이콘과 라벨을 같은 리듬으로 정렬합니다.
 */
export const Button = ({
  asChild = false,
  children,
  className,
  fullWidth = false,
  leadingVisual,
  size = 'md',
  tone = 'white',
  trailingVisual,
  type = 'button',
  variant = 'solid',
  ...props
}: ButtonProps) => {
  const buttonClassName = cx(buttonRecipe({ fullWidth, size, tone, variant }), className);
  const renderContent = (labelContent: React.ReactNode) => (
    <>
      {leadingVisual ? (
        <span aria-hidden className={buttonVisualClass}>
          {leadingVisual}
        </span>
      ) : null}
      <span className={buttonLabelClass}>{labelContent}</span>
      {trailingVisual ? (
        <span aria-hidden className={buttonVisualClass}>
          {trailingVisual}
        </span>
      ) : null}
    </>
  );

  if (asChild) {
    if (!React.isValidElement(children)) {
      throw new Error('Button with asChild requires a single React element child.');
    }

    const child = children as React.ReactElement<{
      children?: React.ReactNode;
      className?: string;
    }>;

    return React.cloneElement(child, {
      ...props,
      className: cx(buttonClassName, child.props.className),
      children: renderContent(child.props.children),
    });
  }

  return (
    <button {...props} className={buttonClassName} type={type}>
      {renderContent(children)}
    </button>
  );
};
