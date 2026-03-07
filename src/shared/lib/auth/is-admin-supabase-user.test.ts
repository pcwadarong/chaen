import { isAdminSupabaseUser } from '@/shared/lib/auth/is-admin-supabase-user';

describe('isAdminSupabaseUser', () => {
  it('user id가 일치하면 관리자로 판별한다', () => {
    expect(
      isAdminSupabaseUser(
        {
          email: 'guest@example.com',
          id: 'admin-user-id',
        },
        {
          adminUserId: 'admin-user-id',
        },
      ),
    ).toBe(true);
  });

  it('관리자 식별값과 모두 다르면 false를 반환한다', () => {
    expect(
      isAdminSupabaseUser(
        {
          email: 'guest@example.com',
          id: 'user-2',
        },
        {
          adminUserId: 'admin-user-id',
        },
      ),
    ).toBe(false);
  });

  it('사용자 정보가 없으면 false를 반환한다', () => {
    expect(
      isAdminSupabaseUser(null, {
        adminUserId: 'admin-user-id',
      }),
    ).toBe(false);
  });
});
