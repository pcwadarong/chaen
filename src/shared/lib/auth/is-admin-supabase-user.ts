type SupabaseUserIdentity = {
  email?: string | null;
  id?: string | null;
};

type AdminIdentity = {
  adminUserId: string | null;
};

/**
 * Supabase 사용자 정보가 관리자 식별값과 일치하는지 판별합니다.
 * user id가 일치하면 관리자로 간주합니다.
 */
export const isAdminSupabaseUser = (
  user: SupabaseUserIdentity | null | undefined,
  adminIdentity: AdminIdentity,
): boolean => {
  if (!user) return false;

  const normalizedUserId = user.id?.trim() || null;
  const normalizedAdminUserId = adminIdentity.adminUserId?.trim() || null;

  return Boolean(
    normalizedUserId && normalizedAdminUserId && normalizedUserId === normalizedAdminUserId,
  );
};
