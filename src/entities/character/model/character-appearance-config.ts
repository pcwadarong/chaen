export const CHARACTER_OUTFIT_COLOR_CONFIG = {
  contact: {
    outer: '#E7B749',
    pants: '#929569',
    ribon: '#B04747',
  },
  main: {
    outer: '#FF6F0F',
    pants: '#00A05B',
    ribon: '#B04747',
  },
} as const;

export const CHARACTER_TINTS = {
  hair: '#654835',
} as const;

export type CharacterOutfitColors =
  (typeof CHARACTER_OUTFIT_COLOR_CONFIG)[keyof typeof CHARACTER_OUTFIT_COLOR_CONFIG];
