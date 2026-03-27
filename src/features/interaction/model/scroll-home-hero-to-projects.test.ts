// @vitest-environment jsdom

import { scrollHomeHeroToProjects } from '@/features/interaction/model/scroll-home-hero-to-projects';

describe('scrollHomeHeroToProjects', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('데스크탑 프레임 스크롤 컨테이너가 없으면 window 기준으로 hero 끝까지 스크롤해야 한다', () => {
    const triggerElement = document.createElement('section');
    document.body.append(triggerElement);

    vi.spyOn(window, 'matchMedia').mockReturnValue({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: '',
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    } as MediaQueryList);

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 120,
    });

    const scrollToSpy = vi.fn();
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: scrollToSpy,
    });

    vi.spyOn(triggerElement, 'getBoundingClientRect').mockReturnValue({
      bottom: 920,
      height: 1000,
      left: 0,
      right: 0,
      toJSON: () => undefined,
      top: 120,
      width: 0,
      x: 0,
      y: 120,
    });

    scrollHomeHeroToProjects(triggerElement);

    expect(scrollToSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      top: 440,
    });
  });

  it('데스크탑 프레임 스크롤 컨테이너가 있으면 해당 컨테이너 기준으로 hero 끝까지 스크롤해야 한다', () => {
    const primaryScrollRegion = document.createElement('div');
    primaryScrollRegion.dataset.primaryScrollRegion = 'true';
    document.body.append(primaryScrollRegion);

    const triggerElement = document.createElement('section');
    document.body.append(triggerElement);

    vi.spyOn(window, 'matchMedia').mockReturnValue({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: true,
      media: '',
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    } as MediaQueryList);

    Object.defineProperty(primaryScrollRegion, 'clientHeight', {
      configurable: true,
      value: 700,
    });
    Object.defineProperty(primaryScrollRegion, 'scrollTop', {
      configurable: true,
      value: 200,
    });
    const scrollToSpy = vi.fn();
    Object.defineProperty(primaryScrollRegion, 'scrollTo', {
      configurable: true,
      value: scrollToSpy,
    });

    vi.spyOn(primaryScrollRegion, 'getBoundingClientRect').mockReturnValue({
      bottom: 700,
      height: 700,
      left: 0,
      right: 1200,
      toJSON: () => undefined,
      top: 0,
      width: 1200,
      x: 0,
      y: 0,
    });
    vi.spyOn(triggerElement, 'getBoundingClientRect').mockReturnValue({
      bottom: 900,
      height: 1000,
      left: 0,
      right: 1200,
      toJSON: () => undefined,
      top: 120,
      width: 1200,
      x: 0,
      y: 120,
    });

    scrollHomeHeroToProjects(triggerElement);

    expect(scrollToSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      top: 620,
    });
  });
});
