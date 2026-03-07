type SupabaseUserIdentity = {
  email?: string | null;
  id?: string | null;
};

type AdminIdentity = {
  adminEmail: string | null;
  adminUserId: string | null;
};

/**
 * Supabase 사용자 정보가 관리자 식별값과 일치하는지 판별합니다.
 * 이메일과 user id 중 하나라도 일치하면 관리자로 간주합니다.
 */
export const isAdminSupabaseUser = (
  user: SupabaseUserIdentity | null | undefined,
  adminIdentity: AdminIdentity,
): boolean => {
  if (!user) return false;

  const normalizedEmail = user.email?.trim().toLowerCase() || null;
  const normalizedAdminEmail = adminIdentity.adminEmail?.trim().toLowerCase() || null;
  const normalizedUserId = user.id?.trim() || null;
  const normalizedAdminUserId = adminIdentity.adminUserId?.trim() || null;

  const matchesEmail = Boolean(
    normalizedEmail && normalizedAdminEmail && normalizedEmail === normalizedAdminEmail,
  );
  const matchesUserId = Boolean(
    normalizedUserId && normalizedAdminUserId && normalizedUserId === normalizedAdminUserId,
  );

  return matchesEmail || matchesUserId;
};
