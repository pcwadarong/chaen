export type MarkdownColorPreset = {
  hex: string;
  label: string;
  softBackgroundColor: string;
  textColor: string;
};

/**
 * toolbar와 markdown preview에서 공통으로 사용하는 색상 프리셋입니다.
 * 다크/라이트 모드 모두에서 지나치게 튀지 않도록 본문 색상과 연한 배경색을 함께 정의합니다.
 */
export const markdownColorPresets: MarkdownColorPreset[] = [
  {
    hex: '#EF4444',
    label: 'red',
    softBackgroundColor: 'rgba(239, 68, 68, 0.16)',
    textColor: '#DC2626',
  },
  {
    hex: '#F97316',
    label: 'orange',
    softBackgroundColor: 'rgba(249, 115, 22, 0.16)',
    textColor: '#EA580C',
  },
  {
    hex: '#EAB308',
    label: 'yellow',
    softBackgroundColor: 'rgba(234, 179, 8, 0.18)',
    textColor: '#CA8A04',
  },
  {
    hex: '#22C55E',
    label: 'green',
    softBackgroundColor: 'rgba(34, 197, 94, 0.16)',
    textColor: '#16A34A',
  },
  {
    hex: '#3B82F6',
    label: 'blue',
    softBackgroundColor: 'rgba(59, 130, 246, 0.16)',
    textColor: '#2563EB',
  },
  {
    hex: '#A855F7',
    label: 'purple',
    softBackgroundColor: 'rgba(168, 85, 247, 0.16)',
    textColor: '#9333EA',
  },
  {
    hex: '#94A3B8',
    label: 'gray',
    softBackgroundColor: 'rgba(148, 163, 184, 0.18)',
    textColor: '#64748B',
  },
];

/**
 * 저장된 hex 값에 대응하는 프리셋을 찾아 preview 스타일 계산에 재사용합니다.
 */
export const getMarkdownColorPreset = (hex: string) =>
  markdownColorPresets.find(color => color.hex.toLowerCase() === hex.trim().toLowerCase()) ?? null;
