/**
 * editor 본문에 삽입 가능한 첨부 파일의 공개 메타데이터입니다.
 *
 * @property contentType 첨부 파일의 MIME 타입입니다.
 * @property fileName 사용자가 업로드한 원본 파일명입니다.
 * @property fileSize 첨부 파일 크기(byte)입니다.
 * @property url 첨부 파일에 접근할 수 있는 public 또는 내부 download URL입니다.
 */
export type EditorAttachment = {
  contentType: string;
  fileName: string;
  fileSize: number;
  url: string;
};
