export type TagDetail = { ko: string; en: string; ja: string; fr: string };
export type TagLocale = keyof TagDetail;
export type TagMap = Record<string, TagDetail>;

/**
 * 프로젝트 태그 slug -> locale별 표시 라벨 매핑입니다.
 */
export const TAG_MAP: TagMap = {
  // 기술 스택
  nextjs: { ko: 'Next.js', en: 'Next.js', ja: 'Next.js', fr: 'Next.js' },
  react: { ko: 'React', en: 'React', ja: 'React', fr: 'React' },
  javascript: { ko: 'JavaScript', en: 'JavaScript', ja: 'JavaScript', fr: 'JavaScript' },
  typescript: { ko: 'TypeScript', en: 'TypeScript', ja: 'TypeScript', fr: 'TypeScript' },
  websocket: { ko: 'Web Socket', en: 'Web Socket', ja: 'Web Socket', fr: 'Web Socket' },
  css: { ko: 'CSS', en: 'CSS', ja: 'CSS', fr: 'CSS' },

  // 카테고리 및 경험
  cs: { ko: 'CS', en: 'CS', ja: 'CS', fr: 'CS' },
  retrospect: { ko: '회고', en: 'Retrospect', ja: '振り返り', fr: 'Rétrospective' },
  review: { ko: '리뷰', en: 'Review', ja: 'レビュー', fr: 'Critique' },
  boostcamp: {
    ko: '네이버 부스트캠프',
    en: 'Naver Boostcamp',
    ja: 'Naver Boostcamp',
    fr: 'Naver Boostcamp',
  },
  'open-source': { ko: '오픈 소스', en: 'Open Source', ja: 'オープンソース', fr: 'Open Source' },

  // 특수 목적 및 최적화
  'framer-motion': { ko: '애니메이션', en: 'Animation', ja: 'アニメーション', fr: 'Animation' },
  performance: { ko: '최적화', en: 'Performance', ja: '最適化', fr: 'Optimisation' },
  'mobile-optimization': {
    ko: '모바일 최적화',
    en: 'Mobile',
    ja: 'モバイル最適化',
    fr: 'Optimisation Mobile',
  },
};

const SUPPORTED_TAG_LOCALES = ['ko', 'en', 'ja', 'fr'] as const;

/**
 * locale 문자열을 태그 라벨 변환에 사용할 locale로 정규화합니다.
 */
export const normalizeTagLocale = (locale: string): TagLocale =>
  SUPPORTED_TAG_LOCALES.includes(locale as TagLocale) ? (locale as TagLocale) : 'en';

/**
 * 태그 slug를 locale에 맞는 라벨로 변환합니다.
 * 매핑이 없으면 원본 slug를 그대로 반환합니다.
 */
export const getTagLabel = (tag: string, locale: TagLocale = 'en') =>
  TAG_MAP[tag.trim().toLowerCase()]?.[locale] ?? tag;

/**
 * 문자열 locale 입력을 포함해 태그 라벨을 조회하는 편의 함수입니다.
 */
export const getTagLabelByLocale = (tag: string, locale: string) =>
  getTagLabel(tag, normalizeTagLocale(locale));
