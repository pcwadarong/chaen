import { describe, expect, it } from 'vitest';

import {
  buildDraftContinueHref,
  formatDraftUpdatedAt,
} from '@/views/editor-drafts/model/editor-drafts.utils';

describe('editor drafts utils', () => {
  it('resume draft는 resume 편집 화면으로 연결한다', () => {
    expect(
      buildDraftContinueHref({
        contentId: null,
        contentType: 'resume',
        id: 'resume-draft-1',
        title: '이력서 초안',
        updatedAt: '2026-03-13T09:00:00.000Z',
      }),
    ).toBe('/admin/resume/edit?draftId=resume-draft-1');
  });

  it('invalid date는 원본 문자열을 그대로 반환한다', () => {
    expect(formatDraftUpdatedAt('not-a-date')).toBe('not-a-date');
  });
});
