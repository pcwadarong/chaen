import type { Project } from '@/entities/project/model/types';
import { formatMonthYear } from '@/shared/lib/date/format-month-year';

export type ProjectPeriodSource = Pick<Project, 'period_end' | 'period_start'> & {
  created_at?: string | null;
  publish_at?: string | null;
};

/**
 * 프로젝트 기간을 locale에 맞는 월/연도 범위 문자열로 변환합니다.
 */
export const formatProjectPeriod = (
  item: ProjectPeriodSource,
  locale: string,
  ongoingLabel: string,
) => {
  const startText = formatMonthYear(
    item.period_start ?? item.created_at ?? item.publish_at,
    locale,
  );
  const endText = formatMonthYear(item.period_end, locale);

  if (startText && endText) return `${startText} - ${endText}`;
  if (startText && !endText) return `${startText} - ${ongoingLabel}`;
  if (startText) return startText;
  return ongoingLabel;
};
