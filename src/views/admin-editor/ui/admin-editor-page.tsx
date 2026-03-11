import type { ComponentProps } from 'react';

import { AdminEditorShell } from '@/widgets/admin-editor/ui/admin-editor-shell';

type AdminEditorPageProps = {
  availableTags: ComponentProps<typeof AdminEditorShell>['availableTags'];
  locale: string;
};

/**
 * 관리자 전용 공용 에디터 페이지입니다.
 * 추후 article, project, resume 편집 화면의 공통 베이스로 사용합니다.
 */
export const AdminEditorPage = ({ availableTags, locale: _locale }: AdminEditorPageProps) => (
  <AdminEditorShell availableTags={availableTags} />
);
