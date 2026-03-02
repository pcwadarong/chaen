/**
 * 원본 파일명 앞에 UUID를 붙여 충돌을 방지한 스토리지 파일명을 생성합니다.
 */
export const createUniqueStorageFileName = (originalFileName: string) => {
  const sanitizedFileName = originalFileName.trim().replaceAll(/\s+/g, '-');

  return `${crypto.randomUUID()}-${sanitizedFileName}`;
};
