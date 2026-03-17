import { describe, expect, it, vi } from 'vitest';

import {
  getInitialScheduleFields,
  getLocalScheduleMinFields,
} from '@/widgets/editor/ui/publish/publish-panel-schedule';

describe('publish panel schedule helpers', () => {
  it('지나간 publishAt은 즉시 발행 모드로 정규화한다', () => {
    const now = new Date('2026-03-14T09:00:00.000Z');

    expect(getInitialScheduleFields('2026-03-10T09:00:00.000Z', now)).toEqual({
      dateInput: '',
      publishMode: 'immediate',
      timeInput: '',
    });
  });

  it('미래 publishAt은 로컬 date/time 필드로 복원한다', () => {
    const now = new Date('2026-03-01T00:00:00.000Z');

    expect(getInitialScheduleFields('2026-03-20T01:00:00.000Z', now)).toMatchObject({
      dateInput: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      publishMode: 'scheduled',
      timeInput: expect.stringMatching(/^\d{2}:\d{2}$/),
    });
  });

  it('현재 시각 기준 최소 date/time 값을 계산한다', () => {
    const now = new Date('2026-03-14T09:27:45.000Z');
    vi.setSystemTime(now);

    expect(getLocalScheduleMinFields(now)).toEqual({
      minDateInput: `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`,
      minTimeInput: `${`${now.getHours()}`.padStart(2, '0')}:${`${now.getMinutes()}`.padStart(2, '0')}`,
    });
  });
});
