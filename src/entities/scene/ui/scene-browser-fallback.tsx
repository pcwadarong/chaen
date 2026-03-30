import React, { useId } from 'react';
import { css, cx } from 'styled-system/css';

type SceneBrowserFallbackProps = Readonly<{
  readonly className?: string;
  readonly description: string;
  readonly title: string;
}>;

/**
 * WebGL을 사용할 수 없는 브라우저에서 3D 씬 대신 보여주는 공통 안내 UI입니다.
 * home hero와 contact scene이 같은 언어와 표면 톤을 유지하도록 공통 계층으로 둡니다.
 */
export const SceneBrowserFallback = ({
  className,
  description,
  title,
}: SceneBrowserFallbackProps) => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <section
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className={cx(wrapperClass, className)}
      data-testid="scene-browser-fallback"
      role="region"
    >
      <div className={panelClass}>
        <h2 className={titleClass} id={titleId}>
          {title}
        </h2>
        <p className={descriptionClass} id={descriptionId}>
          {description}
        </p>
      </div>
    </section>
  );
};

const wrapperClass = css({
  width: 'full',
  height: 'full',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingInline: '6',
  paddingBlock: '8',
});

const panelClass = css({
  width: 'full',
  maxWidth: 'xl',
  display: 'grid',
  gap: '3',
  textAlign: 'center',
});

const titleClass = css({
  textStyle: 'lg',
  fontWeight: 'semibold',
  color: 'text',
});

const descriptionClass = css({
  textStyle: 'sm',
  color: 'muted',
  lineHeight: 'relaxed',
});
