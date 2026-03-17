export type PublishMode = 'immediate' | 'scheduled';

/**
 * 패널 초기값으로 사용할 로컬 날짜/시간 문자열을 계산합니다.
 */
export const getInitialScheduleFields = (publishAt: string | null, now: Date = new Date()) => {
  if (!publishAt) {
    return {
      dateInput: '',
      publishMode: 'immediate' as PublishMode,
      timeInput: '',
    };
  }

  const scheduledDate = new Date(publishAt);

  if (Number.isNaN(scheduledDate.getTime())) {
    return {
      dateInput: '',
      publishMode: 'immediate' as PublishMode,
      timeInput: '',
    };
  }

  if (scheduledDate.getTime() <= now.getTime()) {
    return {
      dateInput: '',
      publishMode: 'immediate' as PublishMode,
      timeInput: '',
    };
  }

  const year = `${scheduledDate.getFullYear()}`;
  const month = `${scheduledDate.getMonth() + 1}`.padStart(2, '0');
  const date = `${scheduledDate.getDate()}`.padStart(2, '0');
  const hours = `${scheduledDate.getHours()}`.padStart(2, '0');
  const minutes = `${scheduledDate.getMinutes()}`.padStart(2, '0');

  return {
    dateInput: `${year}-${month}-${date}`,
    publishMode: 'scheduled' as PublishMode,
    timeInput: `${hours}:${minutes}`,
  };
};

/**
 * 로컬 기준 현재 시각을 date/time input에 넣을 수 있는 최소값 문자열로 반환합니다.
 */
export const getLocalScheduleMinFields = (now: Date = new Date()) => {
  const year = `${now.getFullYear()}`;
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const date = `${now.getDate()}`.padStart(2, '0');
  const hours = `${now.getHours()}`.padStart(2, '0');
  const minutes = `${now.getMinutes()}`.padStart(2, '0');

  return {
    minDateInput: `${year}-${month}-${date}`,
    minTimeInput: `${hours}:${minutes}`,
  };
};
