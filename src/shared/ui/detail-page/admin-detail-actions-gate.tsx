'use client';

import { useAuth } from '@/shared/providers';
import { AdminDetailActions } from '@/shared/ui/detail-page/admin-detail-actions';

type AdminDetailActionsGateProps = {
  deleteAction: () => Promise<void>;
  editHref: string;
};

/**
 * 전역 인증 상태를 기준으로 관리자 전용 상세 액션을 조건부 렌더링합니다.
 */
export const AdminDetailActionsGate = ({ deleteAction, editHref }: AdminDetailActionsGateProps) => {
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return <AdminDetailActions deleteAction={deleteAction} editHref={editHref} />;
};
