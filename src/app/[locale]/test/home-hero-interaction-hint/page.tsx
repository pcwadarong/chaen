import { css } from 'styled-system/css';

import { HomeHeroInteractionHint } from '@/widgets/home-hero-scene/ui/home-hero-interaction-hint';

const FIXTURE_SECTIONS = Array.from({ length: 8 }, (_, index) => ({
  body: `홈 히어로 상호작용 안내 계약을 검증하기 위한 fixture section ${index + 1}`,
  id: `hint-section-${index + 1}`,
  title: `Hint Fixture Section ${index + 1}`,
}));

/**
 * HomeHeroInteractionHint의 브라우저 dismissal과 scroll hide 계약을 검증하기 위한 fixture 페이지입니다.
 */
const HomeHeroInteractionHintTestPage = () => (
  <main className={pageClass}>
    <section className={heroClass}>
      <h1 className={titleClass}>Home Hero Interaction Hint Fixture</h1>
      <p className={descriptionClass}>
        첫 진입 안내 문구가 닫힘 후 다시 나타나지 않고, scroll top이 임계값을 넘으면 자동으로
        사라져야 한다.
      </p>
      <HomeHeroInteractionHint />
    </section>
    <div className={sectionListClass}>
      {FIXTURE_SECTIONS.map(section => (
        <section className={sectionClass} id={section.id} key={section.id}>
          <h2 className={sectionTitleClass}>{section.title}</h2>
          <p className={sectionBodyClass}>{section.body}</p>
        </section>
      ))}
    </div>
  </main>
);

export default HomeHeroInteractionHintTestPage;

const pageClass = css({
  position: 'relative',
  display: 'grid',
  gap: '6',
  minHeight: '[180svh]',
  px: '4',
  py: '6',
  _desktopUp: {
    px: '7',
    py: '7',
  },
});

const heroClass = css({
  position: 'relative',
  minHeight: '[36rem]',
  display: 'grid',
  alignContent: 'start',
  gap: '3',
  p: '5',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderColor: 'border',
  background:
    '[linear-gradient(180deg, color-mix(in srgb, #5d5bff 12%, white) 0%, color-mix(in srgb, #5d5bff 4%, white) 100%)]',
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
