type ResolvedLocaleValue<T> = {
  locale: string;
  value: T;
};

/**
 * locale 후보를 순서대로 조회해 첫 번째 유효 값과 실제 사용된 locale을 반환합니다.
 */
export const resolveFirstAvailableLocaleEntry = async <T>({
  fetchByLocale,
  hasValue,
  locales,
}: {
  fetchByLocale: (locale: string) => Promise<T>;
  hasValue: (value: T) => boolean;
  locales: string[];
}): Promise<ResolvedLocaleValue<T> | null> => {
  for (const locale of locales) {
    const value = await fetchByLocale(locale);
    if (hasValue(value)) {
      return {
        locale,
        value,
      };
    }
  }

  return null;
};
