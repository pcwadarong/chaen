import { buildAdminPath } from './admin-path';

describe('buildAdminPath', () => {
  it('관리자 루트 경로를 locale prefix와 함께 생성한다', () => {
    expect(buildAdminPath({ locale: 'ko' })).toBe('/ko/admin');
  });

  it('로그인 경로를 locale prefix와 함께 생성한다', () => {
    expect(buildAdminPath({ locale: 'ja', section: 'login' })).toBe('/ja/admin/login');
  });

  it('locale이 비어 있거나 잘못되면 기본 locale을 사용한다', () => {
    expect(buildAdminPath({ locale: 'invalid-locale', section: 'editor' })).toBe(
      '/ko/admin/editor',
    );
  });
});
