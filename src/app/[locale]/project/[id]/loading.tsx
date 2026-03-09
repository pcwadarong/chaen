import { useTranslations } from 'next-intl';
import { css, cx } from 'styled-system/css';

/**
 * 프로젝트 상세 로딩 상태 UI입니다.
 */
const ProjectDetailLoading = () => {
  const t = useTranslations('ProjectDetail');

  return (
    <main className={pageClass}>
      <section aria-busy="true" aria-label={t('loading')} aria-live="polite" className={panelClass}>
        <div className={lineLgClass} />
        <div className={lineMdClass} />
        <div className={lineSmClass} />
      </section>
    </main>
  );
};

const pageClass = css({
  width: '[min(1120px, calc(100% - 2rem))]',
  mx: 'auto',
  pt: '12',
  pb: '20',
});

const panelClass = css({
  display: 'grid',
  gap: '3',
  p: '7',
  borderRadius: 'lg',
  border: '[1px solid var(--colors-border)]',
  backgroundColor: 'surface',
});

const lineBaseClass = css({
  height: '4',
  borderRadius: 'full',
  backgroundColor: 'surfaceMuted',
});

const lineLgClass = cx(lineBaseClass, css({ width: '[62%]' }));

const lineMdClass = cx(lineBaseClass, css({ width: '[82%]' }));

const lineSmClass = cx(lineBaseClass, css({ width: '[45%]' }));

export default ProjectDetailLoading;
