import { css } from 'styled-system/css';

const SCROLL_SECTIONS = Array.from({ length: 10 }, (_, index) => ({
  body: `전역 네비게이션 scroll 계약을 검증하기 위한 fixture section ${index + 1}`,
  id: `section-${index + 1}`,
  title: `Fixture Section ${index + 1}`,
}));

/**
 * 전역 네비게이션이 app-frame 내부 scroll viewport에서 숨김/표시되는지 검증하는 fixture 페이지입니다.
 */
const GlobalNavScrollTestPage = () => (
  <main className={pageClass}>
    <section className={heroClass}>
      <h1 className={titleClass}>GlobalNav Scroll Fixture</h1>
      <p className={descriptionClass}>
        데스크톱 app-frame 내부 스크롤에서 global nav가 아래로는 숨고, 위로는 다시 보여야 한다.
      </p>
    </section>
    <div className={sectionListClass}>
      {SCROLL_SECTIONS.map(section => (
        <section className={sectionClass} id={section.id} key={section.id}>
          <h2 className={sectionTitleClass}>{section.title}</h2>
          <p className={sectionBodyClass}>{section.body}</p>
        </section>
      ))}
    </div>
  </main>
);

export default GlobalNavScrollTestPage;

const pageClass = css({
  display: 'grid',
  gap: '6',
  px: '4',
  py: '6',
  _desktopUp: {
    px: '7',
    py: '7',
  },
});

const heroClass = css({
  display: 'grid',
  gap: '3',
  p: '5',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderColor: 'border',
  background:
    '[linear-gradient(180deg, color-mix(in srgb, #5d5bff 10%, white) 0%, color-mix(in srgb, #5d5bff 4%, white) 100%)]',
});

const titleClass = css({
  fontSize: '[clamp(2rem, 5vw, 3rem)]',
  lineHeight: 'none',
  letterSpacing: '[-0.04em]',
  fontWeight: 'semibold',
});

const descriptionClass = css({
  maxWidth: '[44rem]',
  fontSize: 'md',
  color: 'muted',
});

const sectionListClass = css({
  display: 'grid',
  gap: '4',
});

const sectionClass = css({
  minHeight: '[18rem]',
  display: 'grid',
  alignContent: 'start',
  gap: '3',
  p: '5',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderColor: 'border',
  background: 'surface',
});

const sectionTitleClass = css({
  fontSize: '2xl',
  fontWeight: 'semibold',
});

const sectionBodyClass = css({
  fontSize: 'sm',
  color: 'muted',
});
