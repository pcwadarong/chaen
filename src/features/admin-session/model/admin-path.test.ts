import { buildAdminPath } from '@/features/admin-session/model/admin-path';

describe('buildAdminPath', () => {
  it('관리자 루트 경로를 항상 한국어 locale prefix로 생성한다', () => {
    expect(buildAdminPath({ locale: 'ko' })).toBe('/admin');
  });

  it('로그인 경로도 입력 locale과 무관하게 한국어 locale prefix를 사용한다', () => {
    expect(buildAdminPath({ locale: 'ja', section: 'login' })).toBe('/admin/login');
  });

  it('locale이 비어 있거나 잘못돼도 동일한 한국어 관리자 경로를 반환한다', () => {
    expect(buildAdminPath({ locale: 'invalid-locale', section: 'login' })).toBe('/admin/login');
  });
});
