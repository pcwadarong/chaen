import type { EditorDraftSummary } from '@/entities/editor/api/editor.types';

/**
 * draft 타입과 contentId 여부에 따라 이어쓰기 경로를 계산합니다.
 */
export const buildDraftContinueHref = (item: EditorDraftSummary) => {
  if (item.contentType === 'article') {
    return item.contentId
      ? `/admin/articles/${item.contentId}/edit`
      : `/admin/articles/new?draftId=${item.id}`;
  }

  if (item.contentType === 'project') {
    return item.contentId
      ? `/admin/projects/${item.contentId}/edit`
      : `/admin/projects/new?draftId=${item.id}`;
  }

  return `/admin/resume/edit?draftId=${item.id}`;
};

/**
 * 목록 표시용 수정 시각을 YYYY-MM-DD HH:MM 형식으로 포맷합니다.
 */
export const formatDraftUpdatedAt = (updatedAt: string) => {
  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) {
    return updatedAt;
  }

  const year = `${date.getFullYear()}`;
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};
