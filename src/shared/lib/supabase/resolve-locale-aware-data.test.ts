import { isLocaleColumnMissingError, resolveLocaleAwareData } from './resolve-locale-aware-data';

describe('isLocaleColumnMissingError', () => {
  it('locale 컬럼 미존재 메시지면 true를 반환한다', () => {
    expect(isLocaleColumnMissingError('column projects.locale does not exist')).toBe(true);
  });

  it('다른 메시지면 false를 반환한다', () => {
    expect(isLocaleColumnMissingError('permission denied')).toBe(false);
  });
});

describe('resolveLocaleAwareData', () => {
  it('대상 locale에 데이터가 있으면 즉시 반환한다', async () => {
    const fetchByLocale = vi.fn().mockResolvedValue({
      data: ['ko-item'],
      localeColumnMissing: false,
    });
    const fetchLegacy = vi.fn().mockResolvedValue(['legacy-item']);

    const result = await resolveLocaleAwareData<string[]>({
      emptyData: [],
      fetchByLocale,
      fetchLegacy,
      isEmptyData: items => items.length === 0,
      targetLocale: 'ko',
    });

    expect(result).toEqual(['ko-item']);
    expect(fetchByLocale).toHaveBeenCalledTimes(1);
    expect(fetchByLocale).toHaveBeenCalledWith('ko');
    expect(fetchLegacy).not.toHaveBeenCalled();
  });

  it('대상 locale이 비어 있으면 fallback locale 데이터를 반환한다', async () => {
    const fetchByLocale = vi
      .fn()
      .mockResolvedValueOnce({
        data: [],
        localeColumnMissing: false,
      })
      .mockResolvedValueOnce({
        data: ['en-item'],
        localeColumnMissing: false,
      });

    const result = await resolveLocaleAwareData<string[]>({
      emptyData: [],
      fetchByLocale,
      fetchLegacy: vi.fn().mockResolvedValue(['legacy-item']),
      isEmptyData: items => items.length === 0,
      targetLocale: 'ko',
    });

    expect(result).toEqual(['en-item']);
    expect(fetchByLocale).toHaveBeenNthCalledWith(1, 'ko');
    expect(fetchByLocale).toHaveBeenNthCalledWith(2, 'en');
  });

  it('locale 컬럼이 없으면 legacy 조회를 사용한다', async () => {
    const fetchLegacy = vi.fn().mockResolvedValue(['legacy-item']);

    const result = await resolveLocaleAwareData<string[]>({
      emptyData: [],
      fetchByLocale: vi.fn().mockResolvedValue({
        data: [],
        localeColumnMissing: true,
      }),
      fetchLegacy,
      isEmptyData: items => items.length === 0,
      targetLocale: 'ko',
    });

    expect(result).toEqual(['legacy-item']);
    expect(fetchLegacy).toHaveBeenCalledTimes(1);
  });

  it('fallback locale에서도 컬럼이 없으면 legacy 조회를 사용한다', async () => {
    const fetchByLocale = vi
      .fn()
      .mockResolvedValueOnce({
        data: [],
        localeColumnMissing: false,
      })
      .mockResolvedValueOnce({
        data: [],
        localeColumnMissing: true,
      });
    const fetchLegacy = vi.fn().mockResolvedValue(['legacy-item']);

    const result = await resolveLocaleAwareData<string[]>({
      emptyData: [],
      fetchByLocale,
      fetchLegacy,
      isEmptyData: items => items.length === 0,
      targetLocale: 'ko',
    });

    expect(result).toEqual(['legacy-item']);
    expect(fetchByLocale).toHaveBeenCalledTimes(2);
    expect(fetchLegacy).toHaveBeenCalledTimes(1);
  });
});
